# WB

## TODO

- [ ] Auth
    - [ ] Store token
    - [ ] Redirect on getUser true
    - [ ] Activate page
- [ ] Canvas
    - [x] Wheel
        - [x] Panning
            - [x] Pan with pan tool
            - [x] Pan with mouse wheel
        - [x] Zooming
        - [x] Restrict wheel on mouse down
    - [x] Modes - select, pan
    - [x] Grid
    - [x] Zoom event listeners
    - [x] Collaboration list
        - [x] Set on join
        - [x] Handle user left and join events
    - [x] Collab cursors
        - [x] Websocket connection
        - [x] Handling events - sending them to the other classes like event dispatcher.
    - [x] Adding rect.
    - [x] Refactor -> use `ctx` instead of `canvas`
    - [x] Create base class & Render with render methods
        - [x] Allow props (width, height, x, y, bg color, stroke color, or even rx ry)
    - [x] Rendering shapes
        - [x] Layering
        - [x] Handling zIndexes
        - [x] Handling multiple objects
            - [x] Create local and world bounds
            - [x] Implement left, top based rendering
            - [x] Handle drawing borders correctly
                - [x] Draw borders on multi selection
                - [x] Remove borders on empty select
    - [x] Selecting.
        - [x] Selecting.
        - [x] Adding multi selector
            - [x] Adding multi selector
        - [x] Deselect on tool change
        - [x] Auto select on new shape added
    - [ ] Controls
        - [ ] Handle changing width, height by controls
    - [x] Movable objects
        - [x] Single movable objects
        - [x] Multiple movable objects
            - [x] Implement moving
            - [x] Fix: bounding box updating
    - [x] Mid way refactor
        - [x] Better event emitter
        - [x] Canvas mouse controller service
            - [x] Use it in select tool
            - [x] Use it in shape drawer
            - [x] Use it in cursor sender
        - [x] Wheel service
    - [ ] Pagination and search
    - [x] Create better signal system
    - [x] Adding pen tool
    - [x] Adding ERASER
        - [ ] Make it work when removing is there. Note: add a seperate class to search widgets
    - [x] Adding text
        - [x] UpdateSize
        - [x] Double click to edit texts
        - [x] Save shapeText in db
        - [ ] Save textboxes in db
    - [x] Adding text to shapes
        - [ ] Add text as soon as shape is created
    - [ ] Sticky note
    - [ ] Undo redo
    - [ ] Sub toolbar
        - [x] Add sub toolbar component
        - [ ] Generate toolbar actions based on selected widget(s)
        - [ ] Subtoolbar multi actions
            - [ ] Remove
            - [ ] Clone
            - [ ] Lock
    - [ ] Delete
        - [x] Remove selection
            - [x] Add update selection method
            - [x] Remove border
        - [x] Destroy widgets
        - [ ] Multiplayer
            - [ ] Delete when a shape is deleted by other user
                - [ ] Delete from canvas
                - [ ] Delete from selection
                - [ ] Destroy
    - [x] Lock
        - [x] Add isLocked prop
        - [x] Subtoolbar actions restriction if widget is locked
        - [x] Prevent drag
        - [x] Prevent resize handler - No need to
        - [x] Prevent commands
        - [x] Change border color
        - [x] Disallow selecting multiple widgets if widgets are locked
    - [ ] Rich text support
        - [x] Add rich text support
        - [ ] Initialize text editor with ops
        - [ ] Handle already implemented changes - color change, background change
        - [ ] Handle text style (bold, italic, underline, strike)
    - [ ] Lines
        - [x] Can relative path save us with extraordinary long points?
        - [ ] Line selecting
            - [x] Disable line selecting from bbox
            - [x] Select lines from the actual path -- apply contains
            - [ ] Deselect even if line is selected on clicking to the outside of line's path
        - [x] Fix stroke width
            - [x] Make stroke width mutable
        - [x] Line border -- lines should not have rectangular border
        - [x] Line controls
            - [x] Add controls
            - [x] Make controls mutate line points
        - [ ] Line attaching
            - [x] Attaching
            - [x] Detaching
            - [x] Updating db
        - [ ] Line bugs
            - [x] Modify line points on resizing
                - [x] Check collaboration
            - [x] Line should not be moved if it has headBindingWidget or tailBindingWidget
            - [x] Line should not be moved if one of the attached shapes is outside of the selection
            - [x] Check is detaching working on reshape handler or toolservice
            - [x] Fix undo redo issue
            - [x] Check if middle points are attaching. if yes fix
            - [x] Line point controls are laggy with collaboration
        - [ ] Images
            - [ ] Select on add
                - [ ] Navigation animation
            - [ ] On multiple adding, history.
                - [x] Multiple history is done
            - [x] Render placeholder
            - [x] Fix resizing. width and height ratio should be protected.
            - [x] Should we use exact same width and height for the imported image or should we scale down? - yes
            - [ ] Image caching on browser?
    - [ ] Bug fixes and things to implement
        - [x] Tooltipprovider
        - [ ] On scroll should we fire mouse move?
        - [x] Fix browser zoom issue
        - [ ] Line moving when all of them in multi selection
        - [ ] Text editing undo redo
        - [x] Wasm delete
        - [ ] Main color?
        - [x] Engine initilization
        - [ ] Multi delete etc
        - [x] Grid color
        - [ ] Name
        - [ ] Users fix?
        - [ ] Collab list
        - [ ] Retina display --------- LATER
        - [ ] Hypo points
        - [ ] Curved line
        - [ ] %1 zoom level
- Refactor & bug fixes
    - [ ] Fix: ShapesDropdown top position
    - [ ] Fix: sidebar menu in mobile
    - [ ] useShallows...
    - [ ] A component to handle boards list
        - [ ] Change error messages on boards list (user) or make it dynamic. Change colors.

## Road map

### Phase 1 -- Make it work!

- Finalize subtoolbar.
- Add shortcuts
- Add history
- Add sticky note shape
- Add lines

#### Phase 2 -- Saving!

- Add versions to prevent race conditions.
- Save storage???

#### Phase 3 -- Enhanced collaboration

- CRDT

time to create a new widget. it is sticky note.

it will be like rectangles. we will be able to add text into it whenever we double click

the corners will be rounded.

we will not resize it from edges. width height should remain. but there is one catch. there will be two type of the sticky note. one square (300x310) and other one is rectangle (565x310). this is the width/height ratio. if I want to increase the width from edge and I'm on square type (width/height ratio) I can make the width 565 and the sticky note becomes a rectangle. we need to arrange this control. there will be no width/height ratio we should remain this one.

there will be box shadow. it will be on the bottom mostly and blurred.

users will not be able to change text color from Subtoolbar. textcolor will be automatically applied. Also for the background color, we will only show some colors (light yellow, yellow, orange, light blue, blue, dark blue, black). so there will be background color option in the subtoolbar but we will not allow customers to create a custom color (from color palatte) like they used to do with shapes.

The text of the sticky note will have some char limit. and by default font size will be automatically handled. we will fit all the text into the sticky note. but customers will be able to change font size. we will only list available options for font size, (need to calculate which fontsizes causes the current text overflow) - or, since the "auto" mode will be for the biggest font size usable for the sticky note, we can just show font size options that are smaller than the calculated "auto" font size.
