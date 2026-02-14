#!/bin/bash

# Pre-commit hook to prevent secrets from being committed
# Install: cp scripts/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

echo "🔍 Running pre-commit security checks..."

# Patterns to detect secrets
PATTERNS=(
  "-----BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY-----"
  "-----BEGIN PRIVATE KEY-----"
  "-----BEGIN ENCRYPTED PRIVATE KEY-----"
  "AKIA[0-9A-Z]{16}"  # AWS Access Key
  "[0-9a-f]{64}"       # Private key hex
  "[0-9a-zA-Z]{32,}"   # API keys
  "password.*=.*['\"][^'\"]{8,}['\"]"
  "secret.*=.*['\"][^'\"]{8,}['\"]"
  "private.*key"
)

# Files to check (excluding allowed files)
FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -v ".gitignore" | grep -v "node_modules" | head -50)

if [ -z "$FILES" ]; then
  exit 0
fi

# Check each file (exclude this hook and scripts)
VIOLATIONS=0
for file in $FILES; do
  # Skip the pre-commit hook itself and script files
  if [[ "$file" == *"pre-commit"* ]] || [[ "$file" == *".sh" ]]; then
    continue
  fi
  
  if [ -f "$file" ]; then
    for pattern in "${PATTERNS[@]}"; do
      matches=$(grep -n -E "$pattern" "$file" 2>/dev/null || true)
      if [ -n "$matches" ]; then
        echo "❌ Potential secret found in $file:"
        echo "$matches" | head -5
        echo ""
        VIOLATIONS=$((VIOLATIONS + 1))
      fi
    done
  fi
done

# Check for wallet files
WALLET_FILES=$(echo "$FILES" | grep -E "wallets/.*\.json$" || true)
if [ -n "$WALLET_FILES" ]; then
  echo "❌ Wallet files detected - DO NOT COMMIT:"
  echo "$WALLET_FILES"
  VIOLATIONS=$((VIOLATIONS + 1))
fi

# Check for .env files
ENV_FILES=$(echo "$FILES" | grep -E "\.env" || true)
if [ -n "$ENV_FILES" ]; then
  echo "❌ Environment files detected - DO NOT COMMIT:"
  echo "$ENV_FILES"
  VIOLATIONS=$((VIOLATIONS + 1))
fi

# Check for secrets directory
SECRETS_FILES=$(echo "$FILES" | grep -E "^secrets/" || true)
if [ -n "$SECRETS_FILES" ]; then
  echo "❌ Secrets directory files detected - DO NOT COMMIT:"
  echo "$SECRETS_FILES"
  VIOLATIONS=$((VIOLATIONS + 1))
fi

if [ $VIOLATIONS -gt 0 ]; then
  echo ""
  echo "🚫 COMMIT BLOCKED: $VIOLATIONS security violation(s) found"
  echo "   Fix these issues before committing"
  exit 1
fi

echo "✅ Security checks passed"
exit 0
