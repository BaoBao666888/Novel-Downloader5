# License And Third-Party Notices

Copyright (c) 2026 BaoBao666888 and contributors.

Original code contributed to this repository is licensed under
**GNU Affero General Public License, version 3.0 only (AGPL-3.0-only)**.
The complete license is in [LICENSE](LICENSE). Upstream code and dependencies
retain their own copyright and license. This notice does not relicense them.

## Included Or Adapted Components

| Component | Source | License |
| --- | --- | --- |
| Original Novel Downloader | [Dodying/UserJs](https://github.com/dodying/UserJs) | MIT. Copyright (c) 2017 Dodying |
| Simplified/Traditional conversion (`chs2cht.js`) | [hustlzp/jquery-s2t](https://github.com/hustlzp/jquery-s2t) | MIT. Copyright (c) 2013-2014 hustlzp |
| CryptoJS code used by decoder helpers | [brix/crypto-js](https://github.com/brix/crypto-js) | MIT. Jeff Mott and Evan Vosberg |
| Baidu LAC forward-pass compatibility port (`tools/TM_LAC_Analyzer.js`) | [baidu/lac](https://github.com/baidu/lac) | Apache-2.0. Copyright (c) 2018 Baidu, Inc. |
| BERT Mini Chinese NER ONNX model, revision `2e6990291be3ec0407ef0d559e8346893b8ff4e9` | [TomatoMTL model card](https://huggingface.co/TomatoMTL/bert-mini-finetuned-ner-chinese-onnx) | Apache-2.0 as declared by the publisher |
| Fine-tuned model underlying the BERT ONNX conversion | [IcyKallen model card](https://huggingface.co/IcyKallen/bert-mini-finetuned-ner-chinese) | Apache-2.0 as declared by the publisher |
| Transformers.js 3.8.1 | [Hugging Face Transformers.js](https://github.com/huggingface/transformers.js) | Apache-2.0 |

Full permissive license texts: [MIT notices](LICENSES/MIT-third-party.txt),
[Baidu LAC / Apache-2.0](LICENSES/Apache-2.0.txt).
The LAC implementation here is a JavaScript browser adaptation with Web Worker
execution, cancellation and model caching, not an unmodified Baidu distribution.

## External Dependencies And Data

Libraries loaded through userscript `@require` or downloaded at runtime retain
their upstream licenses, including fflate, Tesseract.js, ONNX Runtime Web,
html2canvas, Mammoth, JSZip and FileSaver where used. Preserve their license
notices when redistributing or bundling those dependencies.

BERT Mini's model and tokenizer files are downloaded separately, verified
against pinned checksums and cached on the device. Its ONNX weights are about
12.6 MB. The runtime and tokenizer add to the first-download size.
The base model card does not describe the training dataset in detail.
Apache-2.0 is the publisher's declared model license, not a claim about all
underlying training data.

HanLP is an optional experimental REST service, not a bundled model. It is for
testing and research only, and is not recommended for routine or production use.
The community API has usage restrictions and quotas separate from HanLP's
source-code license.
See the [official community API terms](https://bbs.hanlp.com/t/hanlp2-1-restful-api/53)
and [NER documentation](https://hanlp.hankcs.com/demos/ner.html).
No paid plan or shared API key is bundled with this repository.

The LAC model archive is downloaded separately from
[Darkrai9x/vbook-settings](https://github.com/Darkrai9x/vbook-settings).

The repository license does not grant additional rights to third-party
models, dictionaries, fonts, images, website content, or downloaded novels.
All third-party materials retain their respective licenses and copyrights.
