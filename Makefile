# Get the UUID from metadata.json
UUID=$(shell grep -oP '"uuid": "\K[^"]+' metadata.json)
# Get the shell version from metadata.json
SHELL_VERSION=$(shell grep -oP '"shell-version": \[\K[^]]+' metadata.json | grep -oP '"\K[^"]+' | head -n 1)

# Define the installation directory
INSTALL_DIR=${HOME}/.local/share/gnome-shell/extensions/${UUID}
ZIP_FILE=llm-text-modifier@$(shell echo ${UUID} | cut -d'@' -f2).zip

# Files to be installed
FILES = extension.js prefs.js metadata.json schemas/org.gnome.shell.extensions.llm-text-modifier.gschema.xml

.PHONY: help install uninstall zip clean enable disable

help:
	@echo "Available targets:"
	@echo "  install    - Install the extension locally"
	@echo "  uninstall  - Remove the extension"
	@echo "  zip        - Create a zip file for extensions.gnome.org"
	@echo "  clean      - Remove compiled files and zip"
	@echo "  enable     - Enable the extension"
	@echo "  disable    - Disable the extension"

install: clean
	@echo "Installing to ${INSTALL_DIR}"
	@mkdir -p ${INSTALL_DIR}/schemas
	@cp ${FILES} ${INSTALL_DIR}/
	@cp schemas/org.gnome.shell.extensions.llm-text-modifier.gschema.xml ${INSTALL_DIR}/schemas/
	@glib-compile-schemas ${INSTALL_DIR}/schemas/
	@echo "Extension installed. Please log out and log back in, or restart GNOME Shell."

uninstall:
	@echo "Removing ${INSTALL_DIR}"
	@rm -rf ${INSTALL_DIR}
	@echo "Extension uninstalled."

zip: clean
	@echo "Creating ${ZIP_FILE} for upload..."
	@zip -r ${ZIP_FILE} extension.js prefs.js metadata.json schemas
	@echo "Zip file created."

clean:
	@rm -f schemas/gschemas.compiled
	@rm -f ${ZIP_FILE}

enable:
	@gnome-extensions enable ${UUID}

disable:
	@gnome-extensions disable ${UUID}
