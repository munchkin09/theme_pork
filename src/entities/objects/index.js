import { CostReduce } from '../../entities/objects/CostReduce.js';
import { IncomeBoost } from '../../entities/objects/IncomeBoost.js';
import { BuildDiscount } from '../../entities/objects/BuildDiscount.js';
import { UnlockTile } from '../../entities/objects/UnlockTile.js';
import { AttractionPremium } from '../../entities/objects/AttractionPremium.js';
import { AutoMaintenance } from '../../entities/objects/AutoMaintenance.js';


function generatePoolOfObjects() {
    //Extrae 3 objetos aleatorios de la lista completa
    return [new CostReduce(this),
            new IncomeBoost(this),
            new BuildDiscount(this),
            new UnlockTile(this),
            new AttractionPremium(this),
            new AutoMaintenance(this)
        ].sort(() => Math.random() - 0.5).slice(0, 3);
}

export { generatePoolOfObjects };