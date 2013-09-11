//  Timeline.js v0.1 / 2011-05-01       
//  A compact JavaScript animation library with a GUI timeline for fast editing.
//  by Marcin Ignac (http://marcinignac.com) 
//  
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.      
Timeline.prototype.initGUI = function (parameters) {
  var self = this;

  this.element = parameters.element !== undefined ? parameters.element : false;
  this.displayOnlySelected = parameters.displayOnlySelected !== undefined ? parameters.displayOnlySelected : false;
  this.trackLabelWidth = parameters.trackLabelWidth !== undefined ? parameters.trackLabelWidth : 108;
  this.trackLabelHeight = parameters.trackLabelHeight !== undefined ? parameters.trackLabelHeight : 20;
  this.tracksScrollWidth = parameters.tracksScrollWidth !== undefined ? parameters.tracksScrollWidth : 16;
  this.tracksScrollHeight = 0;
  this.tracksScrollThumbPos = 0;
  this.tracksScrollThumbHeight = 0;
  this.tracksScrollY = 0;
  this.timeScrollWidth = 0;
  this.timeScrollHeight = parameters.timeScrollHeight !== undefined ? parameters.timeScrollHeight : 16;
  this.timeScrollThumbPos = 0;
  this.timeScrollThumbWidth = 0;
  this.timeScrollX = 0;
  this.headerHeight = parameters.headerHeight !== undefined ? parameters.headerHeight : 30;
  this.canvasHeight = parameters.canvasHeight !== undefined ? parameters.canvasHeight : 200;
  this.draggingTime = false;
  this.draggingTracksScrollThumb = false;
  this.draggingTimeScrollThumb = false;
  this.draggingKeys = false;
  this.draggingTimeScale = false;
  this.draggingSelectKeys = false;
  this.mousePositionDown = {x: 0, y: 0};
  this.mousePositionMove = {x: 0, y: 0};
  this.selectedKeys = [];
  this.selectedAnims = [];
  this.displayedTracks = [];
  this.timeScale = parameters.timeScale !== undefined ? parameters.timeScale : 1;
  this.colorBackground = parameters.colorBackground !== undefined ? parameters.colorBackground : "#EEEEEE";
  this.colorButtonBackground = parameters.colorButtonBackground !== undefined ? parameters.colorButtonBackground : "#DDDDDD";
  this.colorButtonStroke = parameters.colorButtonStroke !== undefined ? parameters.colorButtonStroke : "#777777";
  this.colorScrollbar = parameters.colorScrollbar !== undefined ? parameters.colorScrollbar : "#DDDDDD";
  this.colorScrollbarThumb = parameters.colorScrollbarThumb !== undefined ? parameters.colorScrollbarThumb : "#999999";
  this.colorTimelineLabel = parameters.colorTimelineLabel !== undefined ? parameters.colorTimelineLabel : "#666666";
  this.colorTimeScale = parameters.colorTimeScale !== undefined ? parameters.colorTimeScale : "#666666";
  this.colorTimelineTick = parameters.colorTimelineTick !== undefined ? parameters.colorTimelineTick : "#999999";
  this.colorHeaderBorder = parameters.colorHeaderBorder !== undefined ? parameters.colorHeaderBorder : "#000000";
  this.colorTimeTicker = parameters.colorTimeTicker !== undefined ? parameters.colorTimeTicker : "#FF0000";
  this.colorTrackBottomLine = parameters.colorTrackBottomLine !== undefined ? parameters.colorTrackBottomLine : "#FFFFFF";
  this.colorObjectLabel = parameters.colorObjectLabel !== undefined ? parameters.colorObjectLabel : "#000000";
  this.colorPropertyLabel = parameters.colorPropertyLabel !== undefined ? parameters.colorPropertyLabel : "#555555";
  this.onTrackRebuild = parameters.onTrackRebuild !== undefined ? parameters.onTrackRebuild : function () {};
  this.onGuiSave = parameters.onGuiSave !== undefined ? parameters.onGuiSave : function () {};

  this.trackNameCounter = 0;
  this.initTracks();
  this.load();

  this.buildDOMContainer();

  this.canvas = document.createElement("canvas");
  this.c = this.canvas.getContext("2d");
  this.canvas.width = 0;
  if (this.element != false) {
    this.element.appendChild(this.canvas);
  } else {
    this.container.appendChild(this.canvas);
  }

  this.buildInputDialog();

  var self = this;
  this.onMouseClick = self.onMouseClick.bind(this);
  this.onMouseDown = self.onMouseDown.bind(this);
  this.onDocumentMouseMove = self.onDocumentMouseMove.bind(this);
  this.onCanvasMouseMove = self.onCanvasMouseMove.bind(this);
  this.onMouseUp = self.onMouseUp.bind(this);
  this.onMouseDoubleClick = self.onMouseDoubleClick.bind(this);
  this.onMouseWheel = self.onMouseWheel.bind(this);
  
  this.canvas.addEventListener('click', self.onMouseClick, false);
  this.canvas.addEventListener('mousedown', self.onMouseDown, false);
  document.body.addEventListener('mousemove', self.onDocumentMouseMove, false);
  this.canvas.addEventListener('mousemove', self.onCanvasMouseMove, false);
  document.body.addEventListener('mouseup', self.onMouseUp, false);
  this.canvas.addEventListener('dblclick', self.onMouseDoubleClick, false);

  // firefox use special DOMMouseScroll event
  var mousewheel = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel";
  this.canvas.addEventListener(mousewheel, self.onMouseWheel, false);
}

Timeline.prototype.buildDOMContainer = function () {
  if (this.element) {
    return this;
  }
  var self = this;
  this.container = document.createElement("div");
  this.container.id = "timeline-container"
  this.container.style.width = "100%";
  this.container.style.height = this.canvasHeight + "px";
  this.container.style.background = this.colorBackground;
  this.container.style.position = "fixed";
  this.container.style.left = "0px";
  this.container.style.bottom = "0px";
  this.container.style.visibility = 'visible';
  document.body.appendChild(this.container);
    document.addEventListener('keypress', function(e){
    if (e.charCode === 104) {
      if (self.container.style.visibility === 'visible') self.container.style.visibility = 'hidden';
      else self.container.style.visibility = 'visible';
    }
  },false);
  this.splitter = document.createElement("div");
  this.splitter.id = "timeline-splitter"
  this.splitter.style.width = "100%";
  this.splitter.style.height = "4px";
  this.splitter.style.cursor = "ns-resize";
  this.splitter.style.position = "fixed";
  this.splitter.style.left = "0px";
  this.splitter.style.bottom = (this.canvasHeight - 2) + "px";
  this.splitter.addEventListener("mousedown", function (e) {
    // use preventDefault to help avoid unwanted scrolling
    e.preventDefault();

    function mouseMove(e) {
      e.preventDefault();
      var h = (window.innerHeight - e.clientY);
      h = Math.max(h, 46);
      self.splitter.style.bottom = (h - 2) + "px";
      self.container.style.height = h + "px";
      self.canvasHeight = h;
      self.tracksScrollY = 0;
      self.tracksScrollThumbPos = 0;
      self.save();
    }

    function mouseUp(e) {
      document.body.removeEventListener("mousemove", mouseMove, false);
      document.body.removeEventListener("mouseup", mouseUp, false);
    }
    document.body.addEventListener("mousemove", mouseMove, false);
    document.body.addEventListener("mouseup", mouseUp, false);
  }, false)
  document.body.appendChild(this.splitter);
}

Timeline.prototype.removeGUI = function () {
  var self = this;
  // remove event listeners
  if (this.canvas) {
    this.canvas.removeEventListener('click', self.onMouseClick);
    this.canvas.removeEventListener('mousedown', self.onMouseDown);
    this.canvas.removeEventListener('mousemove', self.onCanvasMouseMove);
    this.canvas.removeEventListener('dblclick', self.onMouseDoubleClick);
    var mousewheel = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel";
    this.canvas.removeEventListener(mousewheel, self.onMouseWheel);
  }
  document.body.removeEventListener('mousemove', self.onDocumentMouseMove);
  document.body.removeEventListener('mouseup', self.onMouseUp);
  if (this.container && this.canvas) {
    this.container.removeChild(this.canvas);
  }
  if (this.splitter) {
    document.body.removeChild(this.splitter);
  }
  if (this.element) {
    delete this.element;
  }
  delete this.onGuiSave;
  //document.body.removeChild(this.container);
  delete this.selectedKeys;
  delete this.selectedAnims;
  delete this.displayedTracks;
  delete this.container;
  delete this.canvas;
  delete this.splitter;
  delete this.c;
};

Timeline.prototype.onMouseDown = function (event) {
  if (event.shiftKey == false && event.metaKey == false) {
    this.selectedKeys = [];
  }

  var x = event.layerX;
  var y = event.layerY;

  // store mouse start position
  this.mousePositionStart = x;
  this.mousePositionDown.x = x;
  this.mousePositionDown.y = y;

  if (x > this.trackLabelWidth && y < this.headerHeight) {
    //timeline
    this.draggingTime = true;
    this.onCanvasMouseMove(event);
  }
  else if (x > this.canvas.width - this.tracksScrollWidth && y > this.headerHeight) {
    //tracks scroll
    if (y >= this.headerHeight + this.tracksScrollThumbPos && y <= this.headerHeight + this.tracksScrollThumbPos + this.tracksScrollThumbHeight) {
      this.tracksScrollThumbDragOffset = y - this.headerHeight - this.tracksScrollThumbPos;
      this.draggingTracksScrollThumb = true;
    }
  }
  else if (x > this.trackLabelWidth && y > this.headerHeight && y < this.canvasHeight - this.timeScrollHeight) {
    //keys
    this.selectKeys({
      x: event.layerX,
      y: event.layerY
    }, false, event.shiftKey || event.metaKey);
    if (this.selectedKeys.length > 0) {
      this.draggingKeys = true;
    }
    else {
      this.draggingSelectKeys = true;
    }
    this.cancelKeyClick = false;
  }
  else if (x < this.trackLabelWidth && y > this.canvasHeight - this.timeScrollHeight) {
    //time scale
    this.timeScale = Math.max(0.01, Math.min((this.trackLabelWidth - x) / this.trackLabelWidth, 1));
    this.draggingTimeScale = true;
    this.save();
  }
  else if (x > this.trackLabelWidth && y > this.canvasHeight - this.timeScrollHeight) {
    //time scroll   
    if (x >= this.trackLabelWidth + this.timeScrollThumbPos && x <= this.trackLabelWidth + this.timeScrollThumbPos + this.timeScrollThumbWidth) {
      this.timeScrollThumbDragOffset = x - this.trackLabelWidth - this.timeScrollThumbPos;
      this.draggingTimeScrollThumb = true;
    }
  }
}

Timeline.prototype.onMouseWheel = function (event) {
  var x = event.layerX;
  var y = event.layerY;
  var delta = event.detail ? event.detail : event.wheelDelta / 120 * -1;
  if (y > this.headerHeight) {
    this.tracksScrollThumbPos += 20 * delta;
    if (this.tracksScrollThumbPos < 0) {
      this.tracksScrollThumbPos = 0;
    }
    if (this.tracksScrollThumbPos + this.tracksScrollThumbHeight > this.tracksScrollHeight) {
      this.tracksScrollThumbPos = Math.max(0, this.tracksScrollHeight - this.tracksScrollThumbHeight);
    }
    if (this.tracksScrollHeight - this.tracksScrollThumbHeight > 0) {
      this.tracksScrollY = this.tracksScrollThumbPos / (this.tracksScrollHeight - this.tracksScrollThumbHeight);
    }
    else {
      this.tracksScrollY = 0;
    }
  }
}

Timeline.prototype.onDocumentMouseMove = function (event) {
  var x = event.layerX;
  var y = event.layerY;
  var timeOffset = this.xToTime(x) - this.xToTime(this.mousePositionStart);
  this.mousePositionMove.x = x;
  this.mousePositionMove.y = y;

  if (this.draggingTime) {
    this.time = this.xToTime(x);
    var animationEnd = this.findAnimationEnd();
    if (this.time < 0) this.time = 0;
    if (this.time > animationEnd) this.time = animationEnd;
    this.prevTime = this.time - 1 / 30; //FIXME: hardcoded frame delta 1/30
    this.onPlay(this.time);
  }
  if (this.draggingKeys) {
    for (var i = 0; i < this.selectedKeys.length; i++) {
      var draggedKey = this.selectedKeys[i];
      draggedKey.time = Math.max(0, draggedKey.time + timeOffset);
      this.sortTrackKeys(draggedKey.track);
      this.rebuildSelectedTracks();
    }
    this.cancelKeyClick = true;
    this.timeScrollThumbPos = this.timeScrollX * (this.timeScrollWidth - this.timeScrollThumbWidth);
  }
  if (this.draggingTimeScale) {
    this.timeScale = Math.max(0.01, Math.min((this.trackLabelWidth - x) / this.trackLabelWidth, 1));
    this.save();
  }
  this.mousePositionStart = x;
}

Timeline.prototype.onCanvasMouseMove = function (event) {
  var x = event.layerX;
  var y = event.layerY;

  if (this.draggingTracksScrollThumb) {
    this.tracksScrollThumbPos = y - this.headerHeight - this.tracksScrollThumbDragOffset;
    if (this.tracksScrollThumbPos < 0) {
      this.tracksScrollThumbPos = 0;
    }
    if (this.tracksScrollThumbPos + this.tracksScrollThumbHeight > this.tracksScrollHeight) {
      this.tracksScrollThumbPos = Math.max(0, this.tracksScrollHeight - this.tracksScrollThumbHeight);
    }
    if (this.tracksScrollHeight - this.tracksScrollThumbHeight > 0) {
      this.tracksScrollY = this.tracksScrollThumbPos / (this.tracksScrollHeight - this.tracksScrollThumbHeight);
    }
    else {
      this.tracksScrollY = 0;
    }
  }
  if (this.draggingTimeScrollThumb) {
    this.timeScrollThumbPos = x - this.trackLabelWidth - this.timeScrollThumbDragOffset;
    if (this.timeScrollThumbPos < 0) {
      this.timeScrollThumbPos = 0;
    }
    if (this.timeScrollThumbPos + this.timeScrollThumbWidth > this.timeScrollWidth) {
      this.timeScrollThumbPos = Math.max(0, this.timeScrollWidth - this.timeScrollThumbWidth);
    }
    if (this.timeScrollWidth - this.timeScrollThumbWidth > 0) {
      this.timeScrollX = this.timeScrollThumbPos / (this.timeScrollWidth - this.timeScrollThumbWidth);
    }
    else {
      this.timeScrollX = 0;
    }
  }
}

Timeline.prototype.onMouseUp = function (event) {
  if (this.draggingTime) {
    this.draggingTime = false;
  }
  if (this.draggingKeys) {
    this.draggingKeys = false;
  }
  if (this.draggingSelectKeys) {
    // todo: implement selection of keys based on p1 & p2
    var p1 = this.mousePositionDown;
    var p2 = {
      x: event.layerX,
      y: event.layerY
    };
    this.selectKeys(p1, p2, event.shiftKey || event.metaKey);
    this.draggingSelectKeys = false;
  }
  if (this.draggingTracksScrollThumb) {
    this.draggingTracksScrollThumb = false;
  }
  if (this.draggingTimeScale) {
    this.draggingTimeScale = false;
  }
  if (this.draggingTimeScrollThumb) {
    this.draggingTimeScrollThumb = false;
  }
}

Timeline.prototype.onMouseClick = function (event) {
  if (event.layerX < 1 * this.headerHeight - 4 * 0 && event.layerY < this.headerHeight) {
    this.play();
  }
  if (event.layerX > 1 * this.headerHeight - 4 * 0 && event.layerX < 2 * this.headerHeight - 4 * 1 && event.layerY < this.headerHeight) {
    this.pause();
  }

  if (event.layerX > 2 * this.headerHeight - 4 * 1 && event.layerX < 3 * this.headerHeight - 4 * 2 && event.layerY < this.headerHeight) {
    this.stop();
  }

  if (event.layerX > 3 * this.headerHeight - 4 * 2 && event.layerX < 4 * this.headerHeight - 4 * 3 && event.layerY < this.headerHeight) {
    this.export();
  }

  if (this.selectedKeys.length > 0 && !this.cancelKeyClick) {
    this.showKeyEditDialog(event.pageX, event.pageY);
  }
}

Timeline.prototype.onMouseDoubleClick = function (event) {
  var x = event.layerX;
  var y = event.layerY;
  if (x > this.trackLabelWidth && y < this.headerHeight) {
    //timeline
    var timeStr = prompt("Enter time") || "0:0:0";
    var timeArr = timeStr.split(":");
    var seconds = 0;
    var minutes = 0;
    var hours = 0;
    if (timeArr.length > 0) seconds = parseInt(timeArr[timeArr.length - 1]);
    if (timeArr.length > 1) minutes = parseInt(timeArr[timeArr.length - 2]);
    if (timeArr.length > 2) hours = parseInt(timeArr[timeArr.length - 3]);
    this.time = this.totalTime = hours * 60 * 60 + minutes * 60 + seconds;
  }
  else if (x > this.trackLabelWidth && this.selectedKeys.length == 0 && y > this.headerHeight && y < this.canvasHeight - this.timeScrollHeight) {
    this.addKeyAt(x, y);
  }
}

Timeline.prototype.addKeyAt = function (mouseX, mouseY) {
  var selectedTrack = this.getTrackAt({
    x: mouseX,
    y: mouseY
  });
  if (selectedTrack.length == 0) {
    return;
  }
  selectedTrack = selectedTrack[0];

  var newKey = {
    time: this.xToTime(mouseX),
    value: this.getPropertyValue(selectedTrack),
    easing: Timeline.Easing.Linear.EaseNone,
    track: selectedTrack
  };
  if (selectedTrack.keys.length == 0) {
    selectedTrack.keys.push(newKey);
  }
  else if (newKey.time < selectedTrack.keys[0].time) {
    newKey.value = selectedTrack.keys[0].value;
    selectedTrack.keys.unshift(newKey);
  }
  else if (newKey.time > selectedTrack.keys[selectedTrack.keys.length - 1].time) {
    newKey.value = selectedTrack.keys[selectedTrack.keys.length - 1].value;
    selectedTrack.keys.push(newKey);
  }
  else for (var i = 1; i < selectedTrack.keys.length; i++) {
    if (selectedTrack.keys[i].time > newKey.time) {
      var k = (selectedTrack.keys[i].time - newKey.time) / (selectedTrack.keys[i].time - selectedTrack.keys[i - 1].time);
      var delta = selectedTrack.keys[i].value - selectedTrack.keys[i - 1].value;
      newKey.easing = selectedTrack.keys[i - 1].easing;
      newKey.value = selectedTrack.keys[i - 1].value + delta * newKey.easing(k);
      selectedTrack.keys.splice(i, 0, newKey);
      break;
    }
  }
  this.selectedKeys = [newKey];
  this.rebuildSelectedTracks();
}

Timeline.prototype.getTrackAt = function (p1, p2) {
  var result = [];
  var scrollY = this.tracksScrollY * (this.displayedTracks.length * this.trackLabelHeight - this.canvas.height + this.headerHeight);
  var clickedTrackNumber = clickedTrackNumber2 = Math.floor((p1.y - this.headerHeight + scrollY) / this.trackLabelHeight);
  if (p2) {
    clickedTrackNumber2 = Math.floor((p2.y - this.headerHeight + scrollY) / this.trackLabelHeight);
    if (clickedTrackNumber2 < clickedTrackNumber) {
      var tmp = clickedTrackNumber2;
      clickedTrackNumber2 = clickedTrackNumber;
      clickedTrackNumber = tmp;
    }
  }
  for (var i = clickedTrackNumber; i <= clickedTrackNumber2; i++) {
    if (i >= 0 && i < this.displayedTracks.length && this.displayedTracks[i].type != "object") {
      result.push(this.displayedTracks[i]);
    }
  }

  return result;
}

Timeline.prototype.selectKeys = function (p1, p2, keepPreviousSelection) {
  if (!keepPreviousSelection) {
    this.selectedKeys = [];
  }

  var selectedTracks = this.getTrackAt(p1, p2);

  if (selectedTracks.length == 0) {
    return;
  }

  // sort p1 and p2 by x
  if (p2 && p2.x < p1.x) {
    var tmp = p2;
    p2 = p1;
    p1 = tmp;
  }

  for (var k = 0; k < selectedTracks.length; k++) {
    var track = selectedTracks[k];
    for (var i = 0; i < track.keys.length; i++) {
      var key = track.keys[i];
      var x = this.timeToX(key.time);
      var maxX = p2 ? p2.x : p1.x;

      if (x >= p1.x - this.trackLabelHeight * 0.3 && x <= maxX + this.trackLabelHeight * 0.3) {
        // prevent key from being added twice to the selected array
        if (this.selectedKeys.indexOf(key) == -1) {
          this.selectedKeys.push(key);
        }

        //break;
      }
    }
  }
}

Timeline.prototype.selectAnims = function (anims) {
  if (!anims) {
    anims = [];
  }
  this.selectedAnims = anims;
  this.initTracks();
}

Timeline.prototype.preUpdate = function () {
  this.updateGUI();
}

Timeline.prototype.getDisplayedTracks = function () {
  var result = [];
  var current_anims_containers = this.anims_container;
  if (this.displayOnlySelected) {
    current_anims_containers = this.selectedAnims;
  }
  for (var i = 0; i < current_anims_containers.length; i++) {
    var anim_container = current_anims_containers[i];
    for (var j = 0; j < anim_container.tracks.length; j++) {
      var track = anim_container.tracks[j];
      if (track.type == "object" || (track.type == "property" && track.enabled == true)) {
        result.push(track);
      }
    }
  }
  return result;
}

Timeline.prototype.updateGUI = function () {
  if (!this.canvas) {
    this.initGUI(this.parameters);
  }

  this.canvas.width = window.innerWidth;
  this.canvas.height = this.canvasHeight;
  var w = this.canvas.width;
  var h = this.canvas.height;

  // get the current tracks
  this.displayedTracks = this.getDisplayedTracks();


  this.tracksScrollHeight = this.canvas.height - this.headerHeight - this.timeScrollHeight;
  var totalTracksHeight = this.displayedTracks.length * this.trackLabelHeight;
  var tracksScrollRatio = this.tracksScrollHeight / totalTracksHeight;
  this.tracksScrollThumbHeight = Math.min(Math.max(20, this.tracksScrollHeight * tracksScrollRatio), this.tracksScrollHeight);

  this.timeScrollWidth = this.canvas.width - this.trackLabelWidth - this.tracksScrollWidth;
  var animationEnd = this.findAnimationEnd();
  var visibleTime = this.xToTime(this.canvas.width - this.trackLabelWidth - this.tracksScrollWidth) - this.xToTime(0); //100 to get some space after lask key
  var timeScrollRatio = Math.max(0, Math.min(visibleTime / animationEnd, 1));
  this.timeScrollThumbWidth = timeScrollRatio * this.timeScrollWidth;
  if (this.timeScrollThumbPos + this.timeScrollThumbWidth > this.timeScrollWidth) {
    this.timeScrollThumbPos = Math.max(0, this.timeScrollWidth - this.timeScrollThumbWidth);
  }


  this.c.clearRect(0, 0, w, h);

  //timeline
  var timelineStart = 0;
  var timelineEnd = 10;
  var lastTimeLabelX = 0;

  this.c.fillStyle = this.colorTimelineLabel;
  var x = this.timeToX(0);
  //for(var sec=timelineStart; sec<timelineEnd; sec++) {                               
  var sec = timelineStart;
  while (x < this.canvas.width) {
    x = this.timeToX(sec);
    this.drawLine(x, 0, x, this.headerHeight * 0.3, this.colorTimelineTick);

    var minutes = Math.floor(sec / 60);
    var seconds = sec % 60;
    var time = minutes + ":" + ((seconds < 10) ? "0" : "") + seconds;

    if (x - lastTimeLabelX > 30) {
      this.c.fillText(time, x - 6, this.headerHeight * 0.8);
      lastTimeLabelX = x;
    }
    sec += 1;
  }

  //time ticker
  this.drawLine(this.timeToX(this.time), 0, this.timeToX(this.time), h, this.colorTimeTicker);

  // sidebar background
  this.drawRect(0, 0, this.trackLabelWidth, this.canvasHeight, this.colorBackground);

  //buttons  
  this.drawRect(0 * this.headerHeight - 4 * -1, 5, this.headerHeight - 8, this.headerHeight - 8, this.colorButtonBackground);
  this.drawRect(1 * this.headerHeight - 4 * 0, 5, this.headerHeight - 8, this.headerHeight - 8, this.colorButtonBackground);
  this.drawRect(2 * this.headerHeight - 4 * 1, 5, this.headerHeight - 8, this.headerHeight - 8, this.colorButtonBackground);
  this.drawRect(3 * this.headerHeight - 4 * 2, 5, this.headerHeight - 8, this.headerHeight - 8, this.colorButtonBackground);

  //play
  this.c.strokeStyle = this.colorButtonStroke;
  this.c.beginPath();
  this.c.moveTo(4 + 6.5, 5 + 5);
  this.c.lineTo(this.headerHeight - 8, this.headerHeight / 2 + 1.5);
  this.c.lineTo(4 + 6.5, this.headerHeight - 8);
  this.c.lineTo(4 + 6.5, 5 + 5);
  this.c.stroke();

  //pause  
  this.c.strokeRect(this.headerHeight + 5.5, 5 + 5.5, this.headerHeight / 6, this.headerHeight - 8 - 11);
  this.c.strokeRect(this.headerHeight + 5.5 + this.headerHeight / 6 + 2, 5 + 5.5, this.headerHeight / 6, this.headerHeight - 8 - 11);

  //stop    
  this.c.strokeRect(2 * this.headerHeight - 4 + 5.5, 5 + 5.5, this.headerHeight - 8 - 11, this.headerHeight - 8 - 11);

  //export
  this.c.beginPath();
  this.c.moveTo(3 * this.headerHeight - 4 * 2 + 5.5, this.headerHeight - 9.5);
  this.c.lineTo(3 * this.headerHeight - 4 * 2 + 11.5, this.headerHeight - 9.5);
  this.c.moveTo(3 * this.headerHeight - 4 * 2 + 5.5, this.headerHeight - 13.5);
  this.c.lineTo(3 * this.headerHeight - 4 * 2 + 13.5, this.headerHeight - 13.5);
  this.c.moveTo(3 * this.headerHeight - 4 * 2 + 5.5, this.headerHeight - 17.5);
  this.c.lineTo(3 * this.headerHeight - 4 * 2 + 15.5, this.headerHeight - 17.5);
  this.c.stroke();


  //tracks area clipping path
  this.c.save();
  this.c.beginPath();
  this.c.moveTo(0, this.headerHeight + 1);
  this.c.lineTo(this.canvas.width, this.headerHeight + 1);
  this.c.lineTo(this.canvas.width, this.canvas.height - this.timeScrollHeight);
  this.c.lineTo(0, this.canvas.height - this.timeScrollHeight);
  this.c.clip();

  for (var i = 0; i < this.displayedTracks.length; i++) {
    var track = this.displayedTracks[i];
    var yshift = this.headerHeight + this.trackLabelHeight * (i + 1);
    var scrollY = this.tracksScrollY * (this.displayedTracks.length * this.trackLabelHeight - this.canvas.height + this.headerHeight);
    yshift -= scrollY;
    if (yshift < this.headerHeight) continue;
    this.drawTrack(track, yshift);
  }

  // draw selection
  if (this.draggingSelectKeys) {
    var p1 = this.mousePositionDown;
    var p2 = this.mousePositionMove;
    this.c.strokeStyle = this.colorButtonStroke;
    this.c.fillStyle = this.colorTimelineLabel;
    this.c.globalAlpha = 0.3;
    this.drawRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    this.c.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
  }

  this.c.restore();

  //end of label panel
  this.drawLine(this.trackLabelWidth, 0, this.trackLabelWidth, h, "#000000");

  //time scale
  for (var i = 2; i < 20; i++) {
    var f = 1.0 - (i * i) / 361;
    this.drawLine(7 + f * (this.trackLabelWidth - 10), h - this.timeScrollHeight + 4, 7 + f * (this.trackLabelWidth - 10), h - 3, "#999999");
  }

  this.c.fillStyle = this.colorTimeScale;
  this.c.beginPath();
  this.c.moveTo(7 + (1.0 - this.timeScale) * (this.trackLabelWidth - 10), h - 7);
  this.c.lineTo(11 + (1.0 - this.timeScale) * (this.trackLabelWidth - 10), h - 1);
  this.c.lineTo(3 + (1.0 - this.timeScale) * (this.trackLabelWidth - 10), h - 1);
  this.c.fill();

  //tracks scrollbar
  this.drawRect(this.canvas.width - this.tracksScrollWidth, this.headerHeight + 1, this.tracksScrollWidth, this.tracksScrollHeight, this.colorScrollbar);
  if (this.tracksScrollThumbHeight < this.tracksScrollHeight) {
    this.drawRect(this.canvas.width - this.tracksScrollWidth, this.headerHeight + 1 + this.tracksScrollThumbPos, this.tracksScrollWidth, this.tracksScrollThumbHeight, this.colorScrollbarThumb);
  }

  //time scrollbar
  this.drawRect(this.trackLabelWidth, h - this.timeScrollHeight, w - this.trackLabelWidth - this.tracksScrollWidth, this.timeScrollHeight, this.colorScrollbar);
  if (this.timeScrollThumbWidth < this.timeScrollWidth) {
    this.drawRect(this.trackLabelWidth + 1 + this.timeScrollThumbPos, h - this.timeScrollHeight, this.timeScrollThumbWidth, this.timeScrollHeight, this.colorScrollbarThumb);
  }

  //header borders
  this.drawLine(0, 0, w, 0, this.colorHeaderBorder);
  this.drawLine(0, this.headerHeight, w, this.headerHeight, this.colorHeaderBorder);
  this.drawLine(0, h - this.timeScrollHeight, this.trackLabelWidth, h - this.timeScrollHeight, this.colorHeaderBorder);
  this.drawLine(this.trackLabelWidth, h - this.timeScrollHeight - 1, this.trackLabelWidth, h, this.colorHeaderBorder);
}

Timeline.prototype.timeToX = function (time) {
  var animationEnd = this.findAnimationEnd();
  var visibleTime = this.xToTime(this.canvas.width - this.trackLabelWidth - this.tracksScrollWidth) - this.xToTime(20); //50 to get some additional space
  if (visibleTime < animationEnd) {
    time -= (animationEnd - visibleTime) * this.timeScrollX;
  }

  return this.trackLabelWidth + time * (this.timeScale * 200) + 10;
}

Timeline.prototype.xToTime = function (x) {
  var animationEnd = this.findAnimationEnd();
  var visibleTime = (this.canvas.width - this.trackLabelWidth - this.tracksScrollWidth - 20) / (this.timeScale * 200);
  var timeShift = Math.max(0, (animationEnd - visibleTime) * this.timeScrollX);
  return (x - this.trackLabelWidth - 10) / (this.timeScale * 200) + timeShift;
}

Timeline.prototype.drawTrack = function (track, y) {
  var xshift = 5;
  if (track.type == "object") {
    //object track header background
    this.drawRect(0, y - this.trackLabelHeight + 1, this.trackLabelWidth, this.trackLabelHeight - 1, "#FFFFFF");
    //label color
    this.c.fillStyle = this.colorObjectLabel;
  }
  else {
    xshift += 10;
    //label color    
    this.c.fillStyle = this.colorPropertyLabel;
  }

  //bottom track line
  this.drawLine(0, y, this.canvas.width, y, this.colorTrackBottomLine);
  //draw track label
  this.c.fillText(track.name, xshift, y - this.trackLabelHeight / 4);

  //if it's property track then draw anims
  if (track.type == "property") {
    for (var i = 0; i < track.keys.length; i++) {
      var key = track.keys[i];
      var selected = false;
      if (this.selectedKeys.indexOf(key) > -1) {
        selected = true;
      }
      var first = (i == 0);
      var last = (i == track.keys.length - 1);
      var dx = this.timeToX(key.time);
      // don't draw if it's under label
      if (dx >= this.trackLabelWidth) {
        this.drawRombus(dx, y - this.trackLabelHeight * 0.5, this.trackLabelHeight * 0.5, this.trackLabelHeight * 0.5, "#999999", true, true, selected ? "#FF0000" : "#666666");
        this.drawRombus(dx, y - this.trackLabelHeight * 0.5, this.trackLabelHeight * 0.5, this.trackLabelHeight * 0.5, "#DDDDDD", !first, !last);
      }
    }
  }
}

Timeline.prototype.drawLine = function (x1, y1, x2, y2, color) {
  this.c.strokeStyle = color;
  this.c.beginPath();
  this.c.moveTo(x1 + 0.5, y1 + 0.5);
  this.c.lineTo(x2 + 0.5, y2 + 0.5);
  this.c.stroke();
}

Timeline.prototype.drawRect = function (x, y, w, h, color) {
  this.c.fillStyle = color;
  this.c.fillRect(x, y, w, h);
}

Timeline.prototype.drawCenteredRect = function (x, y, w, h, color) {
  this.c.fillStyle = color;
  this.c.fillRect(x - w / 2, y - h / 2, w, h);
}

Timeline.prototype.drawRombus = function (x, y, w, h, color, drawLeft, drawRight, strokeColor) {
  this.c.fillStyle = color;
  if (strokeColor) {
    this.c.lineWidth = 2;
    this.c.strokeStyle = strokeColor;
    this.c.beginPath();
    this.c.moveTo(x, y - h / 2);
    this.c.lineTo(x + w / 2, y);
    this.c.lineTo(x, y + h / 2);
    this.c.lineTo(x - w / 2, y);
    this.c.lineTo(x, y - h / 2);
    this.c.stroke();
    this.c.lineWidth = 1;
  }

  if (drawLeft) {
    this.c.beginPath();
    this.c.moveTo(x, y - h / 2);
    this.c.lineTo(x - w / 2, y);
    this.c.lineTo(x, y + h / 2);
    this.c.fill();
  }

  if (drawRight) {
    this.c.beginPath();
    this.c.moveTo(x, y - h / 2);
    this.c.lineTo(x + w / 2, y);
    this.c.lineTo(x, y + h / 2);
    this.c.fill();
  }
}

Timeline.prototype.initTrackKeys = function (track) {
  track.keys = [];

  for (var j = 0; j < track.anims.length; j++) {
    var anim = track.anims[j];
    if (anim.delay > 0) {
      var startValue = 0;
      var easing = anim.easing;
      if (j == 0) {
        startValue = track.target[track.propertyName];
      }
      else {
        startValue = track.anims[j - 1].endValue;
      }
      track.keys.push({
        time: anim.startTime,
        value: startValue,
        easing: easing,
        track: track,
      });
    }
    var easing = Timeline.Easing.Linear.EaseNone;
    if (j < track.anims.length - 1) {
      if (track.anims[j + 1].delay == 0) {
        easing = track.anims[j + 1].easing;
      }
    }
    track.keys.push({
      time: anim.endTime,
      value: anim.endValue,
      easing: easing,
      track: track
    });
  }
}

Timeline.prototype.initTracks = function () {
  //convert anims to keys
  for (var i = 0; i < this.tracks.length; i++) {
    var track = this.tracks[i];
    if (track.type == "object") continue;
    this.initTrackKeys(track);
  }
}

Timeline.prototype.buildInputDialog = function () {
  this.keyEditDialog = document.createElement("div");
  this.keyEditDialog.id = "keyEditDialog";
  this.keyEditDialog.style.cssText = "position:absolute; padding:5px; background: #DDDDDD; font-family:arial; font-size:11px; left: 100px; top:100px; border: 1px solid #AAAAAA; border-radius: 5px;";

  var easingOptions = "";

  for (var easingFunctionFamilyName in Timeline.Easing) {
    var easingFunctionFamily = Timeline.Easing[easingFunctionFamilyName];
    for (var easingFunctionName in easingFunctionFamily) {
      easingOptions += "<option>" + easingFunctionFamilyName + "." + easingFunctionName + "</option>";
    }
  }

  var controls = "";
  controls += '<label style="margin-right:10px">Value<input type="text" id="keyEditDialogValue"/></label>';
  controls += '<label style="margin-right:10px">Easing<select id="keyEditDialogEasing">' + easingOptions + '</select></label>';
  controls += '<input id="keyEditDialogOK" style="margin-left: 10px; margin-right:10px" type="button" value="OK"/>';
  controls += '<input id="keyEditDialogCancel" style="margin-right:10px" type="button" value="Cancel"/>';
  controls += '<a id="keyEditDialogDelete" style="margin-right:5px" href="#">[x]</a>';
  this.keyEditDialog.innerHTML = controls;
  document.body.appendChild(this.keyEditDialog);

  this.keyEditDialogValue = document.getElementById("keyEditDialogValue");
  this.keyEditDialogEasing = document.getElementById("keyEditDialogEasing");
  this.keyEditDialogOK = document.getElementById("keyEditDialogOK");
  this.keyEditDialogCancel = document.getElementById("keyEditDialogCancel");
  this.keyEditDialogDelete = document.getElementById("keyEditDialogDelete");

  var self = this;

  this.keyEditDialogOK.addEventListener('click', function () {
    self.applyKeyEditDialog();
    self.hideKeyEditDialog();
  }, false)

  this.keyEditDialogCancel.addEventListener('click', function () {
    self.hideKeyEditDialog();
  }, false)

  this.keyEditDialogDelete.addEventListener('click', function () {
    self.deleteSelectedKeys();
    self.rebuildSelectedTracks();
    self.hideKeyEditDialog();
  }, false)

  this.hideKeyEditDialog();
}

Timeline.prototype.applyKeyEditDialog = function () {
  var value = Number(this.keyEditDialogValue.value)
  if (isNaN(value)) {
    return;
  }
  var selectedOption = this.keyEditDialogEasing.options[this.keyEditDialogEasing.selectedIndex];
  var easing = Timeline.easingMap[selectedOption.value];
  for (var i = 0; i < this.selectedKeys.length; i++) {
    this.selectedKeys[i].easing = easing;
    this.selectedKeys[i].value = value;
  }
  this.rebuildSelectedTracks();
}

Timeline.prototype.showKeyEditDialog = function (mouseX, mouseY) {
  this.keyEditDialogValue.value = this.selectedKeys[0].value;
  for (var i = 0; i < this.keyEditDialogEasing.options.length; i++) {
    var option = this.keyEditDialogEasing.options[i];
    var easingFunction = Timeline.easingMap[option.value];
    if (easingFunction == this.selectedKeys[0].easing) {
      this.keyEditDialogEasing.selectedIndex = i;
      break;
    }
  }
  this.keyEditDialog.style.left = Math.max(50, mouseX - 200) + "px";
  this.keyEditDialog.style.top = (mouseY - 50) + "px";
  this.keyEditDialog.style.display = "block";

  this.keyEditDialogValue.focus();
}

Timeline.prototype.deleteSelectedKeys = function () {
  for (var i = 0; i < this.selectedKeys.length; i++) {
    var selectedKey = this.selectedKeys[i];
    var keyIndex = selectedKey.track.keys.indexOf(selectedKey);
    selectedKey.track.keys.splice(keyIndex, 1);
  }
  this.rebuildSelectedTracks();
}

Timeline.prototype.hideKeyEditDialog = function () {
  this.keyEditDialog.style.display = "none";
}

Timeline.prototype.sortTrackKeys = function (track) {
  track.keys.sort(function (a, b) {
    return a.time - b.time;
  });

  var result = "";
  for (var i = 0; i < track.keys.length; i++) {
    result += track.keys[i].time + " ";
  }
}

Timeline.prototype.rebuildSelectedTracks = function () {
  for (var i = 0; i < this.selectedKeys.length; i++) {
    this.rebuildTrackAnimsFromKeys(this.selectedKeys[i].track);
  }
  this.save();
  this.onTrackRebuild();
}

Timeline.prototype.rebuildTrackAnimsFromKeys = function (track) {
  var deletedAnims = [];

  //remove all track's anims from the timeline
  for (var j = 0; j < track.anims.length; j++) {
    var index = this.anims.indexOf(track.anims[j]);
    deletedAnims.push(track.anims[j]);
    this.anims.splice(index, 1);
  }

  //remove all anims from the track
  track.anims.splice(0, track.anims.length);

  if (track.keys.length == 0) {
    return;
  }

  var delay = track.keys[0].time;
  var prevKeyTime = track.keys[0].time;
  var prevKeyValue = track.keys[0].value;
  var prevKeyEasing = Timeline.Easing.Linear.EaseNone;
  //create new anims based on keys
  for (var j = 0; j < track.keys.length; j++) {
    var key = track.keys[j];
    var anim = {
      timeline: this,
      //targetName: track.parent.name,  //propertyTrack.objectTrack.targetName
      target: track.target,
      propertyName: track.propertyName,
      startValue: prevKeyValue,
      endValue: key.value,
      delay: delay,
      startTime: prevKeyTime,
      endTime: key.time,
      easing: prevKeyEasing,
      container: track.container
    };
    track.anims.push(anim);
    this.anims.push(anim);
    delay = 0;
    prevKeyTime = key.time;
    prevKeyValue = key.value;
    prevKeyEasing = key.easing;
  }
}

Timeline.prototype.export = function () {
  var code = "";

  for (var i = 0; i < this.tracks.length; i++) {
    var track = this.tracks[i];
    if (track.type == "object") continue;
    if (track.anims.length == 0) continue;
    code += 'anim("' + track.parent.name + '",' + track.parent.name + ')';
    for (var j = 0; j < track.anims.length; j++) {
      var anim = track.anims[j];
      code += '.to(';
      if (anim.delay) code += anim.delay + ',';
      code += '{' + '"' + anim.propertyName + '"' + ':' + anim.endValue + '}';
      code += ',' + (anim.endTime - anim.startTime);
      if (anim.easing != Timeline.Easing.Linear.EaseNone) code += ', Timeline.Easing.' + Timeline.easingFunctionToString(anim.easing);
      code += ')';
      //code += '.to(' + anim.delay + ',{' + '"' + anim.propertyName + '"' + ':' + anim.endValue + '} ')';
    }
    code += ';\n';
  }

  prompt("Copy this:", code);
}

Timeline.prototype.getKeysDataJSON = function () {
  var data = {};

  for (var i = 0; i < this.tracks.length; i++) {
    var track = this.tracks[i];
    if (track.type != "property") {
      continue;
    }
    var keysData = [];
    for (var j = 0; j < track.keys.length; j++) {
      keysData.push({
        time: track.keys[j].time,
        value: track.keys[j].value,
        easing: Timeline.easingFunctionToString(track.keys[j].easing),
      });
    }
    data[track.id] = keysData;
  }
  return data;
}

Timeline.prototype.loadKeysDataFromJSON = function (data) {
  for (var i = 0; i < this.tracks.length; i++) {
    var track = this.tracks[i];
    if (!data[track.id]) {
      continue;
    }
    if (track.type == "property") {
      var keysData = data[track.id];
      track.keys = [];
      for (var j = 0; j < keysData.length; j++) {
        track.keys.push({
          time: keysData[j].time,
          value: keysData[j].value,
          easing: Timeline.stringToEasingFunction(keysData[j].easing),
          track: track
        })
      }
      this.rebuildTrackAnimsFromKeys(track);
    }
  }
  return true;
}

Timeline.prototype.save = function () {
  var data = this.getKeysDataJSON();

  localStorage["timeline.js.settings.canvasHeight"] = this.canvasHeight;
  localStorage["timeline.js.settings.timeScale"] = this.timeScale;
  localStorage["timeline.js.data." + this.name] = JSON.stringify(data);
  this.onGuiSave();
}

Timeline.prototype.load = function () {
  if (localStorage["timeline.js.settings.canvasHeight"]) {
    this.canvasHeight = localStorage["timeline.js.settings.canvasHeight"];
  }
  if (localStorage["timeline.js.settings.timeScale"]) {
    this.timeScale = localStorage["timeline.js.settings.timeScale"];
  }

  var dataString = localStorage["timeline.js.data." + this.name];
  if (!dataString) return;
  var data = JSON.parse(dataString);
  this.loadKeysDataFromJSON(data);
}