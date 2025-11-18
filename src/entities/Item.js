class Item {
    constructor(id, name, cost, description, effect, isContinuous = false) {
        this.id = id;
        this.name = name;
        this.cost = cost;
        this.description = description;
        this.effect = effect;
        this.isContinuous = isContinuous;
        this.hasApplied = false;
    }

    tick() {
        if (this.isContinuous) {
            this.effect();
        } else if (!this.hasApplied) {
            this.effect();
            this.hasApplied = true;
        }
    }
}

export { Item };