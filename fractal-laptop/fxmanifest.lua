fx_version 'cerulean'
game 'gta5'

author 'InfernoRP'
description 'Modern Laptop Operating System - Mac/Windows 11 Hybrid UI'
version '1.0.0'

shared_scripts {
    'config.lua'
}

client_scripts {
    'client/main.lua'
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server/main.lua'
}

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/css/*.css',
    'html/js/*.js',
    'html/img/**/*',
    'html/fonts/**/*'
}

lua54 'yes'

dependencies {
    'qb-core',
    'oxmysql'
}

