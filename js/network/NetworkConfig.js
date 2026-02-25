// js/network/NetworkConfig.js
class NetworkConfig {
  constructor() {
    this.minDelayMs = 1000; // 1s
    this.maxDelayMs = 3000; // 3s
    this.dropRate = 0.2;    // 20% 
  }

  setDelay(minMs, maxMs) {
    this.minDelayMs = minMs;
    this.maxDelayMs = maxMs;
  }

  setDropRate(rate) {
    // clamp to [0.1, 0.5] 
    if (rate < 0.1) rate = 0.1;
    if (rate > 0.5) rate = 0.5;
    this.dropRate = rate;
  }

  randomDelay() {
    var min = this.minDelayMs;
    var max = this.maxDelayMs;
    return Math.floor(min + Math.random() * (max - min + 1));
  }

  shouldDrop() {
    return Math.random() < this.dropRate;
  }
}