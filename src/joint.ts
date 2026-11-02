export interface Inputs {
  dia: number;
  thick: number;
  pitch: number;
  rivets: number;
  shear: 'single' | 'double';
  tau: number;
  bearing: number;
  tension: number;
  load?: number;
}

export function calculate(input: Inputs) {
  for (const key of ['dia', 'thick', 'pitch', 'rivets', 'tau', 'bearing', 'tension', 'load'] as const) {
    const value = input[key];
    if (key === 'load' && value === undefined) continue;
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      throw new Error(`${key} must be a finite positive number`);
    }
  }
  if (!Number.isSafeInteger(input.rivets)) throw new Error('rivets must be an integer >= 1');
  if (input.pitch <= input.dia) throw new Error('pitch must be greater than dia');
  if (input.shear !== 'single' && input.shear !== 'double') throw new Error('shear must be single or double');
  const shear = input.rivets * (input.shear === 'double' ? 2 : 1) * (Math.PI / 4) * input.dia ** 2 * input.tau;
  const bearing = input.rivets * input.dia * input.thick * input.bearing;
  const tearing = (input.pitch - input.dia) * input.thick * input.tension;
  const solidPlate = input.pitch * input.thick * input.tension;
  const joint = Math.min(shear, bearing, tearing);
  const governing = (['shear', 'bearing', 'tearing'] as const).filter(mode => ({ shear, bearing, tearing })[mode] === joint);
  const efficiency = joint / solidPlate * 100;
  const safetyFactor = input.load === undefined ? undefined : joint / input.load;
  for (const value of [shear, bearing, tearing, solidPlate, joint, efficiency, safetyFactor]) {
    if (value !== undefined && (!Number.isFinite(value) || value <= 0)) throw new Error('calculation outside supported numeric range');
  }
  return { shear, bearing, tearing, solidPlate, joint, governing, efficiency,
    ...(safetyFactor === undefined ? {} : { safetyFactor, status: safetyFactor >= 1 ? 'OK' : 'FAIL' }) };
}
