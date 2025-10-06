#!/bin/bash

# ----------------------------------------------------------------------
# Script: find_string.sh
# Description: Recursively searches for all regular files containing
#              a specific text string and prints their paths.
#
# NEW FEATURE: Files with common non-text extensions (like .log, .zip, .jpg)
#              are now excluded from the final list. Search is case-insensitive.
#
# Usage:
#   ./find_string.sh "your_string" [starting_directory]
# ----------------------------------------------------------------------

# 1. Input Validation
if [ -z "$1" ]; then
    echo "Error: You must provide the string to search for."
    echo "Usage: $0 <search_string> [start_directory]"
    exit 1
fi

# Define variables
SEARCH_STRING="$1"
# Set START_DIR to the second argument, or '.' (current directory) if $2 is empty.
START_DIR="${2:-.}"

# Define the list of extensions to ignore (used in the final filtering step)
# This list prevents binary, image, and archive files from being listed.
# Note: For efficiency, we rely on the file path to contain the extension.
EXCLUDED_EXTENSIONS='(log|zip|tar|gz|rar|7z|jpg|jpeg|png|gif|bmp|pdf|doc|docx|xls|xlsx|ppt|pptx|bin|out|min\.js|min\.css|pyc)$'

echo "Starting search for files containing: \"$SEARCH_STRING\" (case-insensitive)"
echo "Target directory: $START_DIR"
echo "Ignoring files with extensions: $EXCLUDED_EXTENSIONS"
echo "--------------------------------------------------------"

# 2. Search Logic
# The search uses 'find' piped into 'xargs' for robust file handling.
# - find "$START_DIR" -type f -print0: Finds all regular files and prints paths separated by null characters.
# - xargs -0 grep -li "$SEARCH_STRING": Searches the files (case-insensitive, -i) and lists only the filenames (-l) if a match is found.
# - grep -vE: Filters the results, removing (-v) any filename that matches the Extended Regular Expression (-E).
# - 2>/dev/null: Suppress "Permission denied" or other file access errors.
find "$START_DIR" -type f -print0 | \
  xargs -0 grep -li "$SEARCH_STRING" 2>/dev/null | \
  grep -vE "$EXCLUDED_EXTENSIONS"

echo "--------------------------------------------------------"
echo "Search complete."
