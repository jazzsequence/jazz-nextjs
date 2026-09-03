#!/usr/bin/env bash
# install.sh — install the enforcement git hooks.
# Source: https://github.com/jazzsequence/claude-code-reviewer
#
# Safe to re-run, and you SHOULD re-run it after pulling changes that touch
# .githooks/. The installed hook is a copy in .git/hooks/, so edits to the tracked
# sources have no effect until this runs. A silently stale installed hook is the
# failure mode this exists to prevent.
#
# Re-running is non-destructive. Managed files are tracked in .reviewer-manifest
# with the hash they had at install time:
#   - installed copy unchanged since install  → updated in place
#   - installed copy edited by hand           → preserved, with a diff, and a warning
# So local customisation is never silently clobbered by an upstream change.
#
#   ./.githooks/install.sh            # install or update
#   ./.githooks/install.sh --check    # report status, change nothing
#   ./.githooks/install.sh --force    # overwrite even a customised hook

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$REPO_ROOT"

MANIFEST="$REPO_ROOT/.reviewer-manifest"
MODE="install"
case "${1:-}" in
    --check) MODE="check" ;;
    --force) MODE="force" ;;
    "")      ;;
    *) echo "usage: install.sh [--check|--force]" >&2; exit 64 ;;
esac

hash_of() { shasum -a 256 "$1" 2>/dev/null | cut -d' ' -f1; }

manifest_hash() {
    [ -f "$MANIFEST" ] || return 0
    grep -F "	$1" "$MANIFEST" 2>/dev/null | tail -1 | cut -f1
}

echo -e "${BOLD}claude-code-reviewer — hook installation${NC}"
echo ""

# ── Preflight ────────────────────────────────────────────────────────────────
# The hook sources the lib at runtime rather than inlining it, so a missing lib
# means every commit is blocked. Fail here, loudly, rather than there.
for REQUIRED in .githooks/pre-commit .githooks/lib/approval.sh; do
    if [ ! -f "$REQUIRED" ]; then
        echo -e "${RED}❌ $REQUIRED is missing${NC}"
        echo "   The pre-commit hook cannot run without it."
        exit 1
    fi
    if ! bash -n "$REQUIRED"; then
        echo -e "${RED}❌ Syntax error in $REQUIRED — not installing${NC}"
        exit 1
    fi
done

if [ -f .reviewer-config.sh ] && ! bash -n .reviewer-config.sh; then
    echo -e "${RED}❌ Syntax error in .reviewer-config.sh — not installing${NC}"
    exit 1
fi

if [ ! -f .reviewer-config.sh ]; then
    echo -e "${YELLOW}⚠️  No .reviewer-config.sh — the hook will use its built-in defaults${NC}"
    echo "   Those skip E2E entirely. Create one to enable it."
    echo ""
fi

# ── Install the hook ─────────────────────────────────────────────────────────
SRC=".githooks/pre-commit"
DEST=".git/hooks/pre-commit"
SRC_HASH=$(hash_of "$SRC")

STATUS="new"
if [ -f "$DEST" ]; then
    DEST_HASH=$(hash_of "$DEST")
    RECORDED=$(manifest_hash "$DEST")
    if [ "$DEST_HASH" = "$SRC_HASH" ]; then
        STATUS="current"
    elif [ -n "$RECORDED" ] && [ "$DEST_HASH" = "$RECORDED" ]; then
        STATUS="stale"        # unchanged since we installed it — safe to update
    elif [ -z "$RECORDED" ]; then
        # No manifest entry at all: this hook predates manifest tracking, so we
        # cannot tell "old version of ours" from "hand-written by the user".
        # Running install.sh is an explicit instruction to install, so proceed —
        # but back the existing one up first rather than destroying evidence.
        STATUS="unmanaged"
    else
        STATUS="customised"   # edited since we installed it
    fi
fi

case "$STATUS" in
    current) echo -e "${GREEN}✅ Installed hook is already current${NC}" ;;
    new)     echo "   Installing $DEST" ;;
    stale)   echo "   Updating $DEST (unchanged since last install)" ;;
    unmanaged)
        echo -e "${YELLOW}⚠️  $DEST exists but predates manifest tracking${NC}"
        echo "   Backing it up to ${DEST}.bak before installing."
        ;;
    customised)
        echo -e "${YELLOW}⚠️  $DEST differs from $SRC and was not installed by this script${NC}"
        echo "   Differences:"
        diff "$DEST" "$SRC" | sed 's/^/     /' | head -20
        if [ "$MODE" != "force" ]; then
            echo ""
            echo -e "${YELLOW}   Preserved. Re-run with --force to overwrite.${NC}"
        fi
        ;;
esac

if [ "$MODE" = "check" ]; then
    echo ""
    echo "   Status: $STATUS (no changes made)"
    exit 0
fi

if [ "$STATUS" = "customised" ] && [ "$MODE" != "force" ]; then
    exit 1
fi

# Back up whenever the destination is not something we installed. `customised` only
# reaches here under --force (the non-force path exits above), and it is the case where
# the file is *certainly* the user's work — the manifest establishes it was edited after
# we installed it. `unmanaged` is merely uncertain. Backing up the uncertain case but
# not the certain one inverts the safety. --force makes the overwrite intentional; it
# does not make the loss recoverable.
if [ "$STATUS" = "unmanaged" ] || [ "$STATUS" = "customised" ]; then
    cp "$DEST" "${DEST}.bak"
fi

if [ "$STATUS" != "current" ]; then
    cp "$SRC" "$DEST"
    chmod +x "$DEST"
fi
chmod +x .githooks/lib/approval.sh

# Verify the copy rather than trusting cp. An installed hook that has drifted from
# its source is invisible until it misbehaves.
if ! diff -q "$SRC" "$DEST" > /dev/null; then
    echo -e "${RED}❌ Installed hook differs from $SRC after copying${NC}"
    exit 1
fi

# ── Record what we installed ─────────────────────────────────────────────────
{
    echo "# claude-code-reviewer managed files — hash recorded at install time."
    echo "# Used to tell 'unchanged since install' from 'edited by hand'."
    printf '%s\t%s\n' "$(hash_of "$DEST")" "$DEST"
    printf '%s\t%s\n' "$(hash_of .githooks/lib/approval.sh)" ".githooks/lib/approval.sh"
} > "$MANIFEST"

APPROVAL_VERSION=$(bash .githooks/lib/approval.sh version 2>/dev/null || echo "unknown")

echo ""
echo -e "${GREEN}✅ Pre-commit hook installed${NC} (approval format v${APPROVAL_VERSION})"
echo ""
echo "The hook will now:"
echo "  1. Require reviewer agent approval for AI-generated changes"
echo "  2. Verify the approval was issued for the exact staged content"
echo "  3. Enforce commit size limits from .reviewer-config.sh"
echo "  4. Run the configured test, lint, build and E2E commands"
echo "  5. Block commits containing secrets or credentials"
echo ""
echo -e "${YELLOW}Approval flags are bound to a fingerprint of the git index.${NC}"
echo "Restaging after a review invalidates the approval, because the reviewer"
echo "approved content that is no longer what you are committing. Re-run the"
echo "reviewer rather than looking for a way around it."
echo ""
echo "For your own manual changes:"
echo "  USER_COMMIT=1 git commit -m \"message\""
