class TimelineView {
  currentTimeSlice = 0;
  graph = null;

  constructor() {
  }

  setGraph(graph) {
    this.graph = graph;
  }

  updateTimeslice(newTimeSlice) {
    this.graph.setTimeSlice(newTimeSlice);
  }

  setup(data) {
    let _this = this
    this.currentTimeSlice = 0;

    let timeline = document.getElementById('timeline');
    timeline.innerHTML = "";

    let firstButton = document.getElementById("firstBtn");
    let new_firstButton = firstButton.cloneNode(true);
    firstButton.parentNode.replaceChild(new_firstButton, firstButton);
    new_firstButton.addEventListener("click", function() {
      if(_this.currentTimeSlice === 0) {
        return;
      }
      _this.currentTimeSlice = 0;
      _this.updateTimeslice(_this.currentTimeSlice);
      _this.updateTimeline(_this.currentTimeSlice);
      _this.scrollTimeline(_this.currentTimeSlice);
    });

    let prevButton = document.getElementById("prevBtn");
    let new_prevButton = prevButton.cloneNode(true);
    prevButton.parentNode.replaceChild(new_prevButton, prevButton);
    new_prevButton.addEventListener("click", function() {
      if(_this.currentTimeSlice === 0) {
        return;
      }
      _this.currentTimeSlice--;
      _this.updateTimeslice(_this.currentTimeSlice);
      _this.updateTimeline(_this.currentTimeSlice);
      _this.scrollTimeline(_this.currentTimeSlice);
    });

    let nextButton = document.getElementById("nextBtn");
    let new_nextButton = nextButton.cloneNode(true);
    nextButton.parentNode.replaceChild(new_nextButton, nextButton);

    new_nextButton.addEventListener("click", function() {
      if(_this.currentTimeSlice === data.timeslices.length - 1) {
        return;
      }
      _this.currentTimeSlice++;
      _this.updateTimeslice(_this.currentTimeSlice);
      _this.updateTimeline(_this.currentTimeSlice);
      _this.scrollTimeline(_this.currentTimeSlice);
    });

    let lastButton = document.getElementById("lastBtn");
    let new_lastButton = lastButton.cloneNode(true);
    lastButton.parentNode.replaceChild(new_lastButton, lastButton);
    new_lastButton.addEventListener("click", function() {
      if(_this.currentTimeSlice === data.timeslices.length - 1) {
        return;
      }
      _this.currentTimeSlice = data.timeslices.length - 1;
      _this.updateTimeslice(_this.currentTimeSlice);
      _this.updateTimeline(_this.currentTimeSlice);
      _this.scrollTimeline(_this.currentTimeSlice);
    });

    data.timeslices.forEach(function (d, i) {
      let slice = document.createElement("div");
      slice.id = 'timeslice-' + i;
      slice.classList.add('timeslice');
      slice.appendChild(document.createTextNode(d.tag));

      timeline.append(slice);

      document.getElementById('timeslice-' + i).addEventListener("click", function() {
        if(i === _this.currentTimeSlice) {
          return;
        }
        _this.currentTimeSlice = i;
        _this.updateTimeslice(_this.currentTimeSlice);
        _this.updateTimeline(_this.currentTimeSlice);
        _this.scrollTimeline(i);
      });
    });

    _this.updateTimeline(0);
    _this.scrollTimeline(_this.currentTimeSlice);
  }

  updateTimeline(index) {
    let sliceElements = document.getElementsByClassName('timeslice')

    Array.prototype.forEach.call(sliceElements, function(e) {
      e.classList.remove("active");
    })

    document.getElementById('timeslice-' + index).classList.add("active");

  }

  scrollTimeline(index) {
    let timeline = document.getElementById('timeline');
    let sliceWidth = document.getElementById('timeslice-' + index).offsetWidth;
    let slicesShown = (document.getElementById('footer').offsetWidth - document.getElementById('timeline-buttons').offsetWidth) / sliceWidth;

    timeline.scrollTo(sliceWidth * index - sliceWidth * slicesShown / 2, 0);
  }

}
