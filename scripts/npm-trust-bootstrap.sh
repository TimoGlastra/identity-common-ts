#!/usr/bin/env bash
set -euo pipefail

# One-time setup for npm trusted publishing in a workspace.
# This configures each package to trust a GitHub Actions workflow.
#
# Usage:
#   bash scripts/npm-trust-bootstrap.sh
#   REPO=openwallet-foundation-labs/identity-common-ts bash scripts/npm-trust-bootstrap.sh
#   WORKFLOW_FILE=release.yml bash scripts/npm-trust-bootstrap.sh
#   ENVIRONMENT=production bash scripts/npm-trust-bootstrap.sh
#
# Requirements:
# - npm >= 11.10
# - write access to each npm package
# - 2FA enabled on your npm account
# - package already exists on npm

REPO="${REPO:-openwallet-foundation-labs/identity-common-ts}"
WORKFLOW_FILE="${WORKFLOW_FILE:-release.yml}"
ENVIRONMENT="${ENVIRONMENT:-}"

if [[ ! -f package.json ]]; then
  echo "Run this script from the repository root."
  exit 1
fi

if [[ ! -d packages ]]; then
  echo "Missing packages directory."
  exit 1
fi

npm_version_raw="$(npm --version)"
npm_major="${npm_version_raw%%.*}"
if (( npm_major < 11 )); then
  echo "npm >= 11 is required for npm trust (found ${npm_version_raw})."
  exit 1
fi

echo "Repository: ${REPO}"
echo "Workflow file: ${WORKFLOW_FILE}"
if [[ -n "${ENVIRONMENT}" ]]; then
  echo "Environment: ${ENVIRONMENT}"
fi

echo
echo "Configuring npm trusted publishing for workspace packages..."

for package_file in packages/*/package.json; do
  pkg_name="$(jq -r '.name' "${package_file}")"

  if [[ -z "${pkg_name}" || "${pkg_name}" == "null" ]]; then
    echo "Skipping ${package_file}: missing package name"
    continue
  fi

  echo
  echo "Package: ${pkg_name}"

  trust_count="$(npm trust list "${pkg_name}" --json 2>/dev/null | jq 'length' 2>/dev/null || echo 0)"
  if [[ "${trust_count}" != "0" ]]; then
    echo "Already configured, skipping."
    continue
  fi

  cmd=(npm trust github "${pkg_name}" --repo "${REPO}" --file "${WORKFLOW_FILE}" --yes)
  if [[ -n "${ENVIRONMENT}" ]]; then
    cmd+=(--environment "${ENVIRONMENT}")
  fi

  echo "Running: ${cmd[*]}"
  "${cmd[@]}"
done

echo
echo "Done. Verify with: npm trust list <package-name>"
