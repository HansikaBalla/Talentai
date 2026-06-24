function Show-Tree {
    param(
        [string]$Path,
        [string]$Prefix = '',
        [string[]]$Exclude = @('node_modules','.git','dist','build','.gitkeep','package-lock.json')
    )
    $items = Get-ChildItem -Path $Path -Force | Where-Object { $Exclude -notcontains $_.Name }
    for ($i = 0; $i -lt $items.Count; $i++) {
        $item   = $items[$i]
        $isLast = ($i -eq $items.Count - 1)
        $branch = if ($isLast) { '\---' } else { '+---' }
        $ext    = if ($isLast) { '    ' } else { '|   ' }
        Write-Host ($Prefix + $branch + $item.Name)
        if ($item.PSIsContainer) {
            Show-Tree -Path $item.FullName -Prefix ($Prefix + $ext) -Exclude $Exclude
        }
    }
}
Write-Host 'talentai-app/'
Show-Tree -Path 'C:\Users\HANSIKA\Downloads\talentai-app'
