PREFIX ?= $(HOME)/.local

.PHONY: install uninstall build dev check test test-terminal clean

install:
	./install.sh

uninstall:
	./uninstall.sh

build:
	npm run build

dev:
	npm run dev

check:
	npm run check

test:
	npm test

test-terminal:
	npm run test:terminal

clean:
	rm -rf dist

# Instalación global con npm (requiere Node 22+)
install-global:
	npm install -g .