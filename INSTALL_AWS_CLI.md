# Install AWS CLI - Step by Step

## Option 1: Official Installer (Recommended for macOS)

### Step 1: Download Installer
The installer has already been downloaded to `/tmp/AWSCLIV2.pkg`

### Step 2: Install
```bash
# Open the installer (requires password)
sudo installer -pkg /tmp/AWSCLIV2.pkg -target /

# Or double-click the file in Finder:
open /tmp/AWSCLIV2.pkg
```

### Step 3: Verify Installation
```bash
# Add to PATH (if not already there)
export PATH="/usr/local/bin:$PATH"

# Test
aws --version
```

---

## Option 2: Using pip (Alternative)

If you prefer not to use sudo:

```bash
# Install using pip (user installation, no sudo needed)
python3 -m pip install --user awscli

# Add to PATH
export PATH="$HOME/Library/Python/3.9/bin:$PATH"

# Test
aws --version
```

---

## Option 3: Manual Download

1. Visit: https://awscli.amazonaws.com/AWSCLIV2.pkg
2. Download the installer
3. Double-click to install
4. Follow the installation wizard

---

## After Installation

1. **Add to PATH** (if needed):
   ```bash
   echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

2. **Verify**:
   ```bash
   aws --version
   # Should show: aws-cli/2.x.x Python/3.x.x Darwin/xx.x.x source/x86_64
   ```

3. **Configure credentials**:
   ```bash
   ./scripts/setup-aws-credentials.sh
   ```

---

## Quick Test

After installation and configuration:

```bash
# Test AWS connection
aws sts get-caller-identity

# Should return your AWS account ID and user ARN
```

---

## Troubleshooting

### "aws: command not found"
- Add `/usr/local/bin` to your PATH
- Or use: `export PATH="/usr/local/bin:$PATH"`

### Installation fails
- Try the pip method: `python3 -m pip install --user awscli`
- Or download manually from AWS website

### Permission denied
- The installer needs admin privileges
- Enter your macOS password when prompted

