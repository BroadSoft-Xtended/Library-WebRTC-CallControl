SHELL := /bin/bash
PATH := node_modules/.bin:$(PATH)

JADE_FILES := $(shell glob-cli "templates/**/*.jade")
STYLUS_FILES := $(shell glob-cli "styles/**/*.styl")

all: js/bdsft-webrtc-templates.js js/bdsft-webrtc-styles.js symlinks
symlinks: node_modules/bdsft-webrtc-templates.js node_modules/bdsft-webrtc-styles.js node_modules/views node_modules/models

node_modules/views: lib/views
	mkdir -p node_modules/ && ln -sf ../lib/views node_modules/views

node_modules/models: lib/models
	mkdir -p node_modules/ && ln -sf ../lib/models node_modules/models

node_modules/bdsft-webrtc-templates.js:
	mkdir -p node_modules/ && ln -sf ../js/bdsft-webrtc-templates.js node_modules/bdsft-webrtc-templates.js

node_modules/bdsft-webrtc-styles.js:
	mkdir -p node_modules/ && ln -sf ../js/bdsft-webrtc-styles.js node_modules/bdsft-webrtc-styles.js

## Compile styles ##################################################################
styles/css: $(STYLUS_FILES)
	stylus --include-css -u stylus-font-face --with {limit:20000} styles/callcontrol.styl -o styles

styles/min.css: styles/css
	cssmin styles/*.css > styles/callcontrol.min.css

js/bdsft-webrtc-styles.js: styles/min.css
	mkdir -p js/ && node_modules/webrtc-core/scripts/export-style styles/callcontrol.min.css js/bdsft-webrtc-styles.js

## Compile jade templates #########################################################
js/bdsft-webrtc-templates.js: $(JADE_FILES)
	mkdir -p js/ && templatizer -d templates -o js/bdsft-webrtc-templates.js