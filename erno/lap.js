/* Ernőnek szóló bemutató videó: a végén megjelenik a záró üzenet. */
  var v = document.getElementById('v'), vege = document.getElementById('vege');
  v.addEventListener('ended', function () { vege.classList.add('lat'); });
  v.addEventListener('play', function () { vege.classList.remove('lat'); });
  document.getElementById('ujra').addEventListener('click', function () { vege.classList.remove('lat'); v.currentTime = 0; v.play(); });
