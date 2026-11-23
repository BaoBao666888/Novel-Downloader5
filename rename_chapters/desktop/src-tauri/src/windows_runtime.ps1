function Get-JavaPackage($assets) {
    foreach ($asset in $assets) {
        $package = $asset.binary.package
        if ($asset.version.major -eq 21 -and $asset.binary.image_type -eq 'jre' -and
            $asset.binary.architecture -eq 'x64' -and $asset.binary.os -eq 'windows' -and
            $package.link -cmatch '^https://github\.com/adoptium/temurin21-binaries/releases/download/[\w.%+-]+/OpenJDK21U-jre_x64_windows_hotspot_[\w.+-]+\.zip$' -and
            $package.checksum -match '^[0-9a-f]{64}$' -and
            $package.size -gt 0 -and $package.size -le 128MB) {
            return $package
        }
    }
    throw 'JAVA_CATALOG'
}

function Get-WebViewPackage($versions) {
    foreach ($release in ($versions | Sort-Object { [version]$_.version } -Descending)) {
        foreach ($build in $release.builds) {
            if ($build.architecture -eq 'x64' -and
                $build.url -cmatch '^https://msedge\.sf\.dl\.delivery\.mp\.microsoft\.com/filestreamingservice/files/[a-f0-9-]{36}/Microsoft\.WebView2\.FixedVersionRuntime\.([0-9.]+)\.x64\.cab$' -and
                $Matches[1] -ceq $release.version) {
                return $build.url
            }
        }
    }
    throw 'WEBVIEW_CATALOG'
}

function Install-NovelStudioRuntime([string]$kind, [string]$runtime, [string]$stage) {
    $ErrorActionPreference = 'Stop'
    $ProgressPreference = 'SilentlyContinue'
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $expanded = Join-Path $stage 'unpacked'
    $destination = Join-Path $runtime $kind
    $binary = if ($kind -eq 'java') { 'bin/java.exe' } else { 'msedgewebview2.exe' }
    if (Test-Path -LiteralPath (Join-Path $destination $binary) -PathType Leaf) { return }
    if (Test-Path -LiteralPath $destination) { throw 'RUNTIME_DESTINATION_EXISTS' }

    if ($kind -eq 'java') {
        $assets = Invoke-RestMethod -UseBasicParsing -TimeoutSec 30 -Uri 'https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture=x64&image_type=jre&os=windows&vendor=eclipse'
        $package = Get-JavaPackage $assets
        $zip = Join-Path $stage 'java.zip'
        Invoke-WebRequest -UseBasicParsing -TimeoutSec 240 -Uri $package.link -OutFile $zip
        if ((Get-Item -LiteralPath $zip).Length -ne $package.size -or
            (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash -ne $package.checksum) {
            throw 'JAVA_CHECKSUM'
        }
        Expand-Archive -LiteralPath $zip -DestinationPath $expanded
    } elseif ($kind -eq 'webview2') {
        $versions = Invoke-RestMethod -UseBasicParsing -TimeoutSec 30 -Uri 'https://developer.microsoft.com/microsoft-edge/api/webview2'
        $url = Get-WebViewPackage $versions
        $cab = Join-Path $stage 'webview2.cab'
        Invoke-WebRequest -UseBasicParsing -TimeoutSec 480 -Uri $url -OutFile $cab
        New-Item -ItemType Directory -Path $expanded | Out-Null
        & (Join-Path ([Environment]::SystemDirectory) 'tar.exe') '-xf' $cab '-C' $expanded | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'WEBVIEW_EXTRACT' }
    } else {
        throw 'RUNTIME_KIND'
    }

    $roots = @($expanded) + @(Get-ChildItem -LiteralPath $expanded -Directory | ForEach-Object FullName)
    $found = @($roots | Where-Object { Test-Path -LiteralPath (Join-Path $_ $binary) -PathType Leaf })
    if ($found.Count -ne 1) { throw 'RUNTIME_LAYOUT' }
    $source = $found[0]
    if ($kind -eq 'webview2') {
        $signature = Get-AuthenticodeSignature -LiteralPath (Join-Path $source $binary)
        if ($signature.Status -ne 'Valid' -or
            $signature.SignerCertificate.Subject -notmatch '(?:^|, )O=Microsoft Corporation(?:,|$)') {
            throw 'WEBVIEW_SIGNATURE'
        }
        # Fixed WebView2 needs these AppContainer read permissions on Windows 10.
        & (Join-Path ([Environment]::SystemDirectory) 'icacls.exe') $source /grant '*S-1-15-2-2:(OI)(CI)(RX)' '*S-1-15-2-1:(OI)(CI)(RX)' | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'WEBVIEW_PERMISSIONS' }
    }
    try {
        [IO.Directory]::Move($source, $destination)
    } catch {
        if (!(Test-Path -LiteralPath (Join-Path $destination $binary) -PathType Leaf)) { throw }
    }
}
