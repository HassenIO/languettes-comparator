module.exports = params =>
  params.reduce((acc, el) => {
    if (el.includes('=')) acc[el.split('=')[0]] = el.split('=')[1];
    return acc;
  }, {});
