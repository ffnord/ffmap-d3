function zigzag_amplitude(d) {
  return d.amplitude;
}

function zigzag_len(d) {
  return d.len;
}

function zigzag_angularFrequency(d) {
  return d.angularFrequency;
}

d3.svg.zigzag = function() {
  var amplitude = zigzag_amplitude,
      len = zigzag_len,
      angularFrequency = zigzag_angularFrequency;

  function zigzag() {
    var A = amplitude.apply(this, arguments),
        l = len.apply(this, arguments),
        ω = angularFrequency.apply(this, arguments) + 1;

    start = -l/2;
    end = l/2;

    step = l/ω;

    var s = "M" + start + ",0";

    for (var i = 1; i<ω; i++)
      s += "L" + (start + i*step) + "," + ((i%2)?A:-A);

    s += "L" + end + ",0";

    return s;
  }

  zigzag.amplitude = function(v) {
    if (!arguments.length) return amplitude;
    amplitude = d3.functor(v);
    return zigzag;
  };

  zigzag.len = function(v) {
    if (!arguments.length) return len;
    len = d3.functor(v);
    return zigzag;
  };

  zigzag.angularFrequency = function(v) {
    if (!arguments.length) return angularFrequency;
    angularFrequency = d3.functor(v);
    return zigzag;
  };

  return zigzag;
};
