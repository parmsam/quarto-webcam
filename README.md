# Webcam Extension For Quarto

Adds a live webcam video feed in your RevealJS slides. Ports [ThomasWeinert/reveal-embed-video](https://github.com/ThomasWeinert/reveal-embed-video/) over to Quarto. Credit goes to [ThomasWeinert](thomas@weinert.info) and [Dave Thomas](dave@pragdave.me) for the original Reveal.js plugin. The original plugin was also licensed under the MIT license.

## Installing

```bash
quarto add parmsam/quarto-webcam
```

This will install the extension under the `_extensions` subdirectory.
If you're using version control, you will want to check in this directory.

## Using

Simply add the extension to the list of revealjs plugins like:

```yaml
title: My Presentation
format:
    revealjs: default
revealjs-plugins:
  - webcam
```

Then use the following syntax within a slide to add a webcam video feed.

```yaml
# Slide title goes here {data-video="small top-right"}

- Slide content goes here
```

You'll need to ensure your webcam is enabled and you have given the browser permission to use it for the presentation.

Note that all you have to do is add the attribute `data-video` to the slide. If you have multiple video inputs (front and rear camera for example) you can click on the video to cycle trough them.

The classes for the `data-video` attribute are:

- big = video width 90% of browser window
- small = video width 15% of browser window
- top-left = position top left corner
- top-right = position top right corner
- bottom-left = position bottom left corner
- bottom-right = position bottom right corner

You can set the `data-video` attribute to false to disable the video.

By default, the key to flip the flashcard is 'c'. You can change this by setting the key option in your YAML header as follows. Ignore the comments in the YAML header below, they are just there to provide explanations of what each option does. The options are not required, but you can use them to customize the behavior of the plugin to your needs.

```yaml
title: "Webcam Example"
format:
  revealjs:
    webcam: 
      toggleKey: "c" # Change the key to toggle the video
      enabled: false # Enable the video stream directly at startup. Pressing [C] will still allow you to toggle it.
      persistent: false # Keep the stream open (the camera active) after opening it once. If it is enabled the plugin will keep the camera on even if the video is not used. This avoids repeat permission request dialogs.
revealjs-plugins:
  - webcam
```

Also, you should be able to use you own CSS classes to position/format the video element. The video element always has the class live-video to avoid conflict with other videos in your presentation.

```css
video.live-video.your-class {
  /* your css definitions */
}
```

## Example

Here is the source code for a minimal example: [example.qmd](example.qmd).

## Acknowledgements

This project uses code from [ThomasWeinert/reveal-embed-video](https://github.com/ThomasWeinert/reveal-embed-video/), which is licensed under the MIT License. 