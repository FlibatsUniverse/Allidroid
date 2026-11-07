# Security

Do not post vulnerabilities, credentials or exploit details in public issues. Use GitHub private vulnerability reporting if the repository Security tab provides it, or message ItzFlibat privately on the [Discord server](https://discord.com/invite/XszKXdqaZP). Reports about the installer belong in the private reporting of the [Allidroid Manager](https://github.com/FlibatsUniverse/AllidroidManager) repository, and reports about the desktop and web client in the [Allicord](https://github.com/FlibatsUniverse/Allicord) repository.

Keep credentials, keystores and signing passwords out of commits. Actions use job-specific permissions; untrusted pull requests build without write tokens. Releases are published only from successful trusted main push builds, using signing material kept in repository secrets. Configure review requirements on main to control what reaches a release. Preserve GPL source and dependency notices when redistributing builds.
