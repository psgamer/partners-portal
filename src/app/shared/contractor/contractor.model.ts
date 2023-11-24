export interface Contractor {
    id: string;
    name: string;
    contractorIds: Contractor['id'][];
}
