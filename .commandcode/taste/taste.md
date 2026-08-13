# Tastes
See [tastes/taste.md](tastes/taste.md)

- Avoids adding new dependencies or build/config complexity when a lighter path exists: when the project lacked an SVG transformer/Metro config for `.svg` assets, preferred rendering the exact SVG path as a `react-native-svg` component instead of adding a transformer (no new dependency, no Metro config change, no rebuild). Confidence: 0.6
