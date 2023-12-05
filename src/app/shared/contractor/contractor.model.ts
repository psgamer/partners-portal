export interface Contractor {
    id: string;
    name: string;
}

export interface ContractorDistributor {
    id: Contractor['id'];
    distributorIds: Contractor['id'][];
}
