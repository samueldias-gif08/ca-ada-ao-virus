These PNGs are the existing painted animation cels isolated by
StoryAssets2D.extractWhole, plus the existing final cast with its white
background removed. No artwork was redrawn.

File URL playback loads these prepared images because browsers block
getImageData on canvases containing local images. HTTP playback retains
the original atlas processing. Registration points are stored in
StoryAssets2D.preparedRegistration.

If a source atlas or its extraction layout changes, regenerate its prepared
cels and registration points together. Open tests/storyOffline.html directly
in a browser to verify the opening and ending without canvas pixel reads.
