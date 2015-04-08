SHELL := /bin/bash
PATH := node_modules/.bin:$(PATH)

JADE_FILES := $(shell glob-cli "templates/**/*.jade")
STYLUS_FILES := $(shell glob-cli "styles/**/*.styl")

all: node_modules/bdsft-webrtc-templates.js node_modules/bdsft-webrtc-styles.js symlinks
symlinks: node_modules/views node_modules/models
	
node_modules/views: lib/views
	ln -sf ../lib/views node_modules/views

node_modules/models: lib/models
	ln -sf ../lib/models node_modules/models

## Compile styles ##################################################################
styles/css: $(STYLUS_FILES)
	stylus --include-css -u stylus-font-face --with {limit:20000} styles/callcontrol.styl -o styles

styles/min.css: styles/css
	cssmin styles/*.css > styles/callcontrol.min.css

node_modules/bdsft-webrtc-styles.js: styles/min.css
	node_modules/webrtc-core/scripts/export-style styles/callcontrol.min.css node_modules/bdsft-webrtc-styles.js

## Compile jade templates #########################################################
node_modules/bdsft-webrtc-templates.js: $(JADE_FILES)
	templatizer -d templates -o node_modules/bdsft-webrtc-templates.js