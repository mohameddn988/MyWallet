# Expo App Template

This repository is an Expo app template that provides a starting point for building React Native applications with Expo, including setup scripts for NativeWind, Git hooks, and project management.

## Scripts

- **clean-keep.ts**: Removes all .keep placeholder files from the project directories (self-deleting script).
- **rename-project.ts**: Updates package.json, app.json, and other files to use the current folder name as the project name.
- **reset-git.ts**: Resets the Git repository by removing .git, reinitializing, and creating a fresh initial commit (self-deleting script).
- **setup-git-hooks.ts**: Sets up Husky for pre-commit linting and Commitlint for commit message validation.
- **setup-nativewind.ts**: Automates the setup of NativeWind, a utility-first CSS library for React Native, by installing dependencies and configuring the project.
- **update-dependencies.ts**: Updates all project dependencies and ensures Expo package compatibility.
