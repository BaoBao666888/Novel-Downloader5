(function () {
    class FqCrypto {
      constructor(key) {
        this.key = this.hexToBytes(key);
        if (this.key.length !== 16) {
          throw new Error(`Invalid key length! Expected 16 bytes, got ${this.key.length}`);
        }
      }
  
      hexToBytes(hex) {
        const bytes = [];
        for (let i = 0; i < hex.length; i += 2) {
          bytes.push(parseInt(hex.substr(i, 2), 16));
        }
        return new Uint8Array(bytes);
      }
  
      bytesToHex(bytes) {
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      }
  
      async encrypt(data, iv) {
        const cryptoKey = await crypto.subtle.importKey('raw', this.key, 'AES-CBC', false, ['encrypt']);
        const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, cryptoKey, this.pkcs7Pad(data));
        return new Uint8Array(encrypted);
      }
  
      async decrypt(data) {
        const iv = data.slice(0, 16);
        const ct = data.slice(16);
        const cryptoKey = await crypto.subtle.importKey('raw', this.key, 'AES-CBC', false, ['decrypt']);
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, cryptoKey, ct);
        return this.pkcs7Unpad(new Uint8Array(decrypted));
      }
  
      pkcs7Pad(data) {
        const blockSize = 16;
        const padding = blockSize - (data.length % blockSize);
        const padded = new Uint8Array(data.length + padding);
        padded.set(data);
        padded.fill(padding, data.length);
        return padded;
      }
  
      pkcs7Unpad(data) {
        const padding = data[data.length - 1];
        if (padding > 16) return data;
        for (let i = data.length - padding; i < data.length; i++) {
          if (data[i] !== padding) return data;
        }
        return data.slice(0, data.length - padding);
      }
  
      async generateRegisterContent(deviceId, strVal = "0") {
        const deviceIdBytes = this.to64BitLE(BigInt(deviceId));
        const strValBytes = this.to64BitLE(BigInt(strVal));
        const combined = new Uint8Array([...deviceIdBytes, ...strValBytes]);
        const iv = crypto.getRandomValues(new Uint8Array(16));
        const encrypted = await this.encrypt(combined, iv);
        const result = new Uint8Array([...iv, ...encrypted]);
        return btoa(String.fromCharCode(...result));
      }
  
      to64BitLE(num) {
        const bytes = new Uint8Array(8);
        for (let i = 0; i < 8; i++) {
          bytes[i] = Number((num >> BigInt(i * 8)) & BigInt(0xFF));
        }
        return bytes;
      }
    }
  
    class FqClient {
      constructor(config) {
        this.config = config;
        this.crypto = new FqCrypto(config.REG_KEY);
        this.dynamicKey = null;
        this.keyExpireTime = 0;
      }
  
      async getContentKeys(itemIds) {
        const itemIdsStr = Array.isArray(itemIds) ? itemIds.join(',') : itemIds;
        return await xhr.sync(
          `https://api5-normal-sinfonlineb.fqnovel.com/reading/reader/batch_full/v?item_ids=${itemIdsStr}&req_type=1&aid=${this.config.AID}&update_version_code=${this.config.VERSION_CODE}`,
          null,
          {
            method: 'GET',
            responseType: 'json',
            headers: {
              "Cookie": `install_id=${this.config.INSTALL_ID}`,
              "User-Agent": "okhttp/4.9.3"
            }
          }
        ).then(res => res.response);
      }
  
      async getDecryptionKey() {
        const now = Date.now();
        if (this.dynamicKey && this.keyExpireTime > now) return this.dynamicKey;
  
        const content = await this.crypto.generateRegisterContent(this.config.SERVER_DEVICE_ID);
        const payload = { content, keyver: 1 };
  
        const result = await xhr.sync(
          `https://api5-normal-sinfonlineb.fqnovel.com/reading/crypt/registerkey?aid=${this.config.AID}`,
          JSON.stringify(payload),
          {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
              "Cookie": `install_id=${this.config.INSTALL_ID}`,
              "User-Agent": "okhttp/4.9.3"
            },
            responseType: 'json'
          }
        ).then(res => res.response);
  
        const encryptedKey = Uint8Array.from(atob(result.data.key), c => c.charCodeAt(0));
        const decryptedKey = await this.crypto.decrypt(encryptedKey);
        this.dynamicKey = this.crypto.bytesToHex(decryptedKey);
        this.keyExpireTime = now + 3600 * 1000;
        return this.dynamicKey;
      }
  
      async decryptContent(encryptedContent) {
        const key = await this.getDecryptionKey();
        const contentCrypto = new FqCrypto(key);
        const decoded = Uint8Array.from(atob(encryptedContent), c => c.charCodeAt(0));
        const decrypted = await contentCrypto.decrypt(decoded);
        const decompressed = await this.gunzip(decrypted);
        return new TextDecoder().decode(decompressed);
      }
  
      async gunzip(data) {
        const ds = new DecompressionStream('gzip');
        const writer = ds.writable.getWriter();
        writer.write(data);
        writer.close();
        return new Response(ds.readable).arrayBuffer().then(buf => new Uint8Array(buf));
      }
    }
  
    // Gán vào unsafeWindow để rule sử dụng được
    unsafeWindow.FqCrypto = FqCrypto;
    unsafeWindow.FqClient = FqClient;
  })();
  