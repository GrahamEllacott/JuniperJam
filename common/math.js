function easeInOut(progress) {
  return progress * progress * (3 - 2 * progress);
}

function lerpValue(start, end, progress) {
  return start + (end - start) * progress;
}

function lerpCounterClockwiseAngle(start, end, progress) {
  return start + counterClockwiseAngleDelta(start, end) * progress;
}

function counterClockwiseAngleDelta(start, end) {
  var delta = (end - start) % (Math.PI * 2);
  if (delta > 0) delta -= Math.PI * 2;
  return delta;
}

function shortestAngleDelta(start, end) {
  var delta = (end - start) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

function distancePointToSegmentSquared(point, segmentStart, segmentEnd) {
  var segmentX = segmentEnd.x - segmentStart.x;
  var segmentZ = segmentEnd.z - segmentStart.z;
  var pointX = point.x - segmentStart.x;
  var pointZ = point.z - segmentStart.z;
  var segmentLengthSquared = segmentX * segmentX + segmentZ * segmentZ;
  var t = segmentLengthSquared > 0 ? (pointX * segmentX + pointZ * segmentZ) / segmentLengthSquared : 0;
  t = Math.max(0, Math.min(1, t));
  var closestX = segmentStart.x + segmentX * t;
  var closestZ = segmentStart.z + segmentZ * t;
  var dx = point.x - closestX;
  var dz = point.z - closestZ;
  return dx * dx + dz * dz;
}
