function stringifyArray(arr) {
  var buffer = '[';

  arr.forEach(function(item, index) {
    if (index !== 0) {
      buffer += ',';
    }
    buffer += stringify(item);
  });

  return buffer + ']';
}

export default function stringify(data) {
  if (data instanceof BigNumber) {
    return data.toString();
  }

  if (data instanceof Date || typeof data !== 'object') {
    return JSON.stringify(data);
  }

  if (Array.isArray(data)) {
    return stringifyArray(data);
  }
  var buffer = '{';

  for (var k in data) {
    if (buffer.length > 1) {
      buffer += ',';
    }
    buffer += '"' + k + '":' + stringify(data[k]);
  }

  return buffer + '}';
}
