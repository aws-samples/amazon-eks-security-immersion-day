---
title : "Install SSM Manager"
weight : 20
---

#### Install Session Manager plugin on Linux

1. Download the Session Manager plugin RPM package.
```bash
cd ~/environment
curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/linux_64bit/session-manager-plugin.rpm" -o "session-manager-plugin.rpm"
```
2. Run the install command.
```bash
sudo yum install -y session-manager-plugin.rpm
```
3. Run the following commands to verify that the Session Manager plugin installed successfully.
```bash
session-manager-plugin
```
If the installation was successful, the following message is returned.
```
The Session Manager plugin is installed successfully. Use the AWS CLI to start a session.
```
