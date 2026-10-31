$ErrorActionPreference = 'Stop'
$voiceConfigPath = if ($env:DSH_CHARACTER_VOICE_CONFIG) { $env:DSH_CHARACTER_VOICE_CONFIG } else { Join-Path $env:USERPROFILE '.dsh-character-voice-studio\config.json' }
Write-Host 'Character Voice Studio - Fish Audio Drama 3'
Write-Host 'Key stays in a local file. Do not paste it in DSH chat.'
$voiceConfig = if (Test-Path -LiteralPath $voiceConfigPath) { Get-Content -LiteralPath $voiceConfigPath -Raw | ConvertFrom-Json } else { Get-Content -LiteralPath (Join-Path $PSScriptRoot 'config.example.json') -Raw | ConvertFrom-Json }
$voiceSecret = Read-Host 'Fish API Key (blank keeps current)' -AsSecureString
if ($voiceSecret.Length -gt 0) { $voicePointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($voiceSecret); try { $voiceConfig.fishApiKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($voicePointer) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($voicePointer) } }
$voiceRef = Read-Host 'Default Fish reference_id (blank keeps current; can import WAV later)'
if ($voiceRef) { $voiceConfig.defaultReferenceId = $voiceRef; $voiceConfig.defaultProfile = '' }
$voiceConfig.rightsConfirmed = (Read-Host 'I have necessary voice/material rights. Type YES to confirm') -ceq 'YES'
$voiceConfig.allowPaidRequests = (Read-Host 'Allow Fish cloud requests and possible charges? Type YES') -ceq 'YES'
$voiceConfig.allowReferenceUpload = (Read-Host 'Allow upload of explicitly selected reference WAV to Fish? Type YES') -ceq 'YES'
New-Item -ItemType Directory -Path (Split-Path -Parent $voiceConfigPath) -Force | Out-Null
$voiceTemp = $voiceConfigPath + '.' + [guid]::NewGuid().ToString('N') + '.tmp'
[IO.File]::WriteAllText($voiceTemp, ($voiceConfig | ConvertTo-Json -Depth 5), [Text.UTF8Encoding]::new($false))
Move-Item -LiteralPath $voiceTemp -Destination $voiceConfigPath -Force
Write-Host "Saved locally: $voiceConfigPath"
Write-Host 'Settings reload on every tool call. No DSH restart required for key/profile changes.'
