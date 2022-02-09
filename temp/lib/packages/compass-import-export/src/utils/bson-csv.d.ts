export function getBSONTypeForValue(value: any): any;
export function detectType(value: any): any;
export function getTypeDescriptorForValue(value: any): {
    type: any;
    isBSON: boolean;
};
export default casters;
export function serialize(doc: Object): Object;
export function valueToString(value: any): any;
declare namespace casters {
    import BSONRegExp = casters.RegExpr;
    export { BSONRegExp };
}
//# sourceMappingURL=bson-csv.d.ts.map