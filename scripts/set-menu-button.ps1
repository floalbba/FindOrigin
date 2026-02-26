# Установка кнопки меню бота для открытия FindOrigin Mini App
# Запуск: .\scripts\set-menu-button.ps1 -BotToken "YOUR_TOKEN" -AppUrl "https://your-domain.vercel.app/tma"

param(
    [Parameter(Mandatory=$true)]
    [string]$BotToken,

    [Parameter(Mandatory=$true)]
    [string]$AppUrl
)

$body = @{
    menu_button = @{
        type = "web_app"
        text = "Открыть FindOrigin"
        web_app = @{
            url = $AppUrl
        }
    }
} | ConvertTo-Json -Depth 4
$uri = "https://api.telegram.org/bot$BotToken/setChatMenuButton"

try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -ContentType "application/json" -Body $body
    if ($response.ok) {
        Write-Host "Кнопка меню установлена: $AppUrl" -ForegroundColor Green
    } else {
        Write-Host "Ошибка: $($response.description)" -ForegroundColor Red
    }
} catch {
    Write-Host "Ошибка запроса: $_" -ForegroundColor Red
}
