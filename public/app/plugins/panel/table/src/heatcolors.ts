var RGB_RGX = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*[0-9\.]+\s*)?\)/

function zero_pad(num, size) {
  var s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
}

function Color(val)
{
  if(typeof(val) === "string" && val[0] === "#") {
    this.code = parseInt(val.slice(1), 16) & 0xFFFFFF;
  } else if(typeof(val) === "string" && RGB_RGX.test(val)) {
    var t = RGB_RGX.exec(val);

    this.code  = (t[1] & 0xFF) << 16;
    this.code |= (t[2] & 0xFF) <<  8;
    this.code |= (t[3] & 0xFF) <<  0;
  } else if(typeof(val) == "number") {
    this.code = val & 0xFFFFFF;
  } else {
    this.code  = (val[0] & 0xFF) << 16;
    this.code |= (val[1] & 0xFF) <<  8;
    this.code |= (val[2] & 0xFF) <<  0;
  }

  this.r = (this.code >> 16) & 0xFF;
  this.g = (this.code >>  8) & 0xFF;
  this.b = (this.code >>  0) & 0xFF;

  var hex  = this.code.toString(16);
  this.str = '#' + zero_pad(hex, 6);
}

function gradient_color(start, end, value, max_value, min_value)
{
  var c0 = new Color(start);
  var c1 = new Color(end);

  var t = (value - min_value) / (max_value - min_value);

  if(t > 1.0) {
    return c1.str;
  } else if(t < 0.0) {
    return c0.str;
  }

  var r = c0.r + (c1.r - c0.r) * t;
  var g = c0.g + (c1.g - c0.g) * t;
  var b = c0.b + (c1.b - c0.b) * t;

  var grad = new Color([r, g, b]);
  return grad.str;
}

function multigrad_color(colors, value, max_value, min_value)
{
  if(colors.length == 0) {
    return undefined;
  }

  var p = (value - min_value) / (max_value - min_value);
  var q = p * (colors.length - 1);
  var i = Math.floor(q);
  var r = q - i;

  if(i < 0) {
    var c = new Color(colors[0]);
    return c.str;
  } else if(i >= (colors.length - 1)) {
    var c = new Color(colors[colors.length - 1]);
    return c.str;
  } else {
    return gradient_color(colors[i], colors[i + 1], r, 1.0, 0.0);
  }
}

function fill_gradient_legend(colors, canvas, horizontal)
{
  if(typeof(horizontal) == 'undefined') {
    horizontal = true;
  }
  var ctx  = canvas.getContext("2d");
  var grad;

  if(horizontal) {
    grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  } else {
    grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  }

  for(var i = 0; i < colors.length; i += 1) {
    var c = i * (1.0 / (colors.length - 1));
    grad.addColorStop(c, colors[i]);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export {gradient_color, multigrad_color, fill_gradient_legend}