// https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion


function hashStringToNumber(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash); // simple hash function
    }
    return hash;
  }

  const ONE_SIXTH = 1 / 6;
  const ONE_THIRD = 1 / 3;
  const TWO_THIRDS = 2 / 3;
  
  const hue2rgb = (p, q, t) => {
    if (t < 0) {
      t += 1;
    }
    if (t > 1) {
      t-= 1;
    }
    if (t < ONE_SIXTH) {
      return p + (q - p) * 6 * t;
    }
    if (t < 0.5) {
      return q;
    }
    if (t < TWO_THIRDS) {
      return p + (q - p) * (TWO_THIRDS - t) * 6;
    }
    return p;
  };
  
  const hsl2rgb = (h, s, l) => {
    if (s === 0) {
      return new Array(3).fill(l);
    }
    const q =
      l < 0.5 ?
        l * s + l :
        l + s - l * s;
    const p = 2 * l - q;
    return [
      hue2rgb(p, q, h + ONE_THIRD),
      hue2rgb(p, q, h),
      hue2rgb(p, q, h - ONE_THIRD),
    ];
  }
  
 export function colorForHost(host) {
    const hash = hashStringToNumber(host ?? "none");
    //console.log(`hash for string ${host??'none'} = ${hash}`);
    const hue = Math.abs(hash) % 360; // generate a hue between 0 and 360
    //console.log(`hue for string ${host??'none'} = ${hue} (hash: ${hash})`);
    const saturation = 70; // fixed saturation (70%)
    const lightness = 65; // fixed lightness (50%)
    const rgb = hsl2rgb(hue/360.0, saturation/100.0, lightness/100.0);
    rgb[0] *= 255;
    rgb[1] *= 255;
    rgb[2] *= 255;

    //console.log(` for host: ${host} using rgb: ${rgb[0]},${rgb[1]},${rgb[2]} - hsl: ${hue}, ${saturation}, ${lightness}`)
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  }