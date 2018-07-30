const Canvas = require('canvas');

exports.generate = xs => {
  const canvas    = new Canvas(350, 500);
  const ctx       = canvas.getContext('2d');
  const userCount = xs.reduce((sum, x) => sum + x.votes, 0);
  const ys        = xs.map(x => ({...x, percent: x.votes / userCount * 100}));

  ys.forEach((y, i) => {
    // Draw percentage bar
    roundRect({
      ctx,
      x       : 5,
      y       : (barHeight + barVMargin) * i + barVMargin,
      width   : y.percent / 100 * barWidth,
      height  : barHeight,
      bgColor : barBgColor,
      bdRadius: 3,
      bdColor : transparent
    });
    // Draw full bar
    roundRect({
      x       : 5,
      y       : (barHeight + barVMargin) * i + barVMargin,
      width   : barWidth,
      height  : barHeight,
      bgColor : transparent,
      bdRadius: 3,
      bdColor : barBdColor
    });

    ctx.font      = `${fontSize}px Arial`;
    ctx.fillStyle = fontColor;
    ctx.fillText(
      `${y.text} - ${y.percent.toFixed(1)}%`,
      15,
      (barHeight + barVMargin) * i + barVMargin + (barHeight - 10)
    );
  });

  return new Promise((resolve, reject) =>
    canvas.toBuffer((err, buf) => err != null
      ? reject(err)
      : resolve(buf)
    )
  );
};

/**
 * Draws a rounded rectangle.
 *
 * @param {CanvasRenderingContext2D} ctx
 * The canvas context.
 *
 * @param {Number} x
 * The top left x coordinate.
 *
 * @param {Number} y
 * The top left y coordinate.
 *
 * @param {Number} width
 * The width of the rectangle.
 *
 * @param {Number} height
 * The height of the rectangle.
 *
 * @param {Number} [radius = 5]
 * The corner radius.
 *
 * @param {Boolean} [fill = 'transparent']
 * The background color.
 *
 * @param {Boolean} [stroke = 'transparent']
 * The border color.
 */
const roundRect = ({
  ctx,
  x = 0, y = 0,
  width = 0, height = 0,
  bgColor = transparent,
  bdRadius = 5,
  bdColor = transparent
}) => {
  const radius = typeof bdRadius === 'number'
    ? {tl: bdRadius, tr: bdRadius, br: bdRadius, bl: bdRadius}
    : Object.keys(defaultRadius).reduce((ps, k) => k in bdRadius
      ? (ps[k] = bdRadius[k], ps)
      : (ps[k] = defaultRadius[k], ps), {});

  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(
    x + width,
    y,
    x + width,
    y + radius.tr
  );
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius.br,
    y + height
  );
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(
    x,
    y + height,
    x,
    y + height - radius.bl
  );
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(
    x,
    y,
    x + radius.tl,
    y
  );
  ctx.closePath();

  if (bgColor !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fill();
  }

  if (bdColor !== 'transparent') {
    ctx.strokeStyle = bdColor;
    ctx.stroke();
  }
};

/**
 * Specifies the slack max width before it modifies
 * the image aspect ratio.
 *
 * @type {Int}
 */
const maxWidth = 350;

/**
 * Specifies the slack max height before it modifies
 * the image aspect ratio.
 *
 * @type {Int}
 */
const maxHeight = 500;

/**
 * Specifies a name for transparent colors.
 *
 * @type {String}
 */
const transparent = 'transparent';

const barWidth = 165;
const barHeight = 40;
const barBdColor = "#000000";
const barBgColor = "#FF0000";
const barVMargin = 5;
const fontSize = 23;
const fontColor = "#000000";

const defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
