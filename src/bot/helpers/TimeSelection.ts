export class TimeSelection {
  private selectedSlots: { date: string; time: string }[] = [];

  // private selectedSlots: Set<string> = new Set();

  toggleSlot(date: string, time: string) {
    this.selectedSlots.push({ date, time });
  }

  getSlots() {
    return this.selectedSlots;
  }

  clear(){
    this.selectedSlots = [];
  }
}