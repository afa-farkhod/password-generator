# password-generator
A minimal, web app that generates random passwords by difficulty level and lets you copy them to the clipboard.

## Features
- Difficulty presets: **Easy, Medium, Strong, Insane, Custom**
- Toggles for **lowercase, uppercase, numbers, symbols**
- Option to **exclude ambiguous** characters (`Il1O0o{}[]()/\'"~,;:<>`)
- **Secure RNG** using `window.crypto.getRandomValues`
- **Strength meter** (entropy estimate)
- One-click **Copy**

## Security note
This app runs entirely in your browser and never stores or sends your passwords anywhere. Always keep generated passwords private.

## Demonstration

<img width="771" height="574" alt="image" src="https://github.com/user-attachments/assets/9136194a-ee7e-4489-9d05-357e40109039" />
