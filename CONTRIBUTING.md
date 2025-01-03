# CONTRIBUTING

## Table of Contents

- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Contributing Code](#contributing-code)
    - [Code Conventions](#code-conventions)
    - [Branch's Name Conventions](#branchs-name-conventions)
    - [Commit Message Conventions](#commit-message-conventions)
- [Development Workflow](#development-workflow)
  - [Clone the Repo](#clone-the-repo)
  - [Create a New Branch](#create-a-new-branch)
  - [Make Your Changes](#make-your-changes)
  - [Push to the Remote Repository](#push-to-the-remote-repository)
  - [Continuous Development Workflow](#continuous-development-workflow)

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue in the Codeberg repository. Make sure to include as much detail as possible to help us reproduce the problem. Ideally, your bug report should include:

- A clear title and description
- Steps to reproduce the bug
- Expected and actual results
- Any relevant logs or error messages

### Suggesting Enhancements

If you have an idea for improving the project, open a new issue and label it as a `feature request`. Please explain:

- The motivation for your suggestion
- How you would like to see it implemented
- Any alternatives you’ve considered

### Contributing Code

#### Code Conventions

Please kindly follow these code conventions so people can understand your work easily.

- **Variable Names**: Use `camelCase` (e.g., `userName`, `totalAmount`).
- **Function Names**: Use `camelCase`, and start with a verb (e.g., `fetchData`, `calculateSum`).
- **Constants**: Use `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`).
- **Class Names**: Use `PascalCase` (e.g., `UserAccount`).
- **File Names**: Use `kebab_case` (e.g., `user_profile.js`).

In addition to naming conventions, please keep your functions short, write comments where necessary, and ensure code is well-formatted.

#### Branch's Name Conventions

To keep the development workflow consistent, please follow these branch naming conventions:

- **Features**: Use `feat/` followed by a short, descriptive feature name.

  - Example: `feat/add-login-form`

- **Bug Fixes**: Use `fix/` followed by a description of the bug.

  - Example: `fix/logout-issue`

- **Documentation**: Use `docs/` followed by the section or document name.

  - Example: `docs/update-readme`

- **Hotfixes**: Use `hotfix/` for urgent fixes that need to be merged immediately.

  - Example: `hotfix/fix-critical-bug`

- **Chore**: Use `chore/` for maintenance tasks or refactoring that don’t affect the functionality.
  - Example: `chore/cleanup-dependencies`

Make sure your branch names are concise and clearly describe the purpose of your changes.

#### Commit Message Conventions

To maintain a clean and understandable commit history, follow these commit message conventions. We use the **Conventional Commits** format:

`<type>(<scope>): <short description>`

- **Type**: Defines the nature of the commit. Common types include:

  - `feat`: A new feature.
  - `fix`: A bug fix.
  - `docs`: Documentation updates.
  - `style`: Code formatting (does not affect functionality).
  - `refactor`: Code changes that neither fix a bug nor add a feature.
  - `test`: Adding or updating tests.
  - `chore`: Routine tasks like updating dependencies or configurations.

- **Scope**: Specifies the part of the codebase affected by the commit. This is optional but encouraged for clarity. Examples: `auth`, `api`, `docs`, `db`.

- **Short Description**: A brief description of the changes made.

**Examples**:

- `feat(auth): add login functionality`
- `fix(ui): fix alignment issue in navbar`
- `docs(readme): update contributing guidelines`
- `style(header): reformat header component for readability`
- `refactor(database): optimize user queries`
- `test(user): add unit tests for user service`
- `chore(deps): update npm dependencies`

By following this structure, you help create a clear and organized commit history, making it easier to understand the purpose of each change.

## Development Workflow

### Clone the Repo

```bash
git clone https://codeberg.org/rvyhvn/etamcode-forum.git
cd etamcode-forum
mkdir tmp
npm install
```

If npm asks you to run `npm audit fix --force` you might just ignore it.

### Create a New Branch

Before making any changes, create a new branch for your work:

```
git checkout -b feature/your-feature-name
```

Use a descriptive name for your branch that reflects the feature or fix you're working on.

### Make Your Changes

Make your changes, and ensure you follow the coding standards of the project. Before submitting your changes:

- Run tests (if available) to make sure your changes don’t break anything.
- Update or add any necessary documentation.

### Push to the Remote Repository

After you made the changes, push to the remote repository.

```
git add .
git commit -m "descriptive messages here"
git push origin feature/your-feature-name
```

### Continous Development Workflow

Please always check the remote commits first if you already away from your machine by:

```
git fetch
git log origin/branch-you-wanna-check
```

or you can check all changes in all branches by:

```
git fetch --all
git log --all --remotes
```

If there are changes, you might run:

```
git add .
git commit -m "your descriptive messages"
git pull origin branch-you-wanna-pull
```
