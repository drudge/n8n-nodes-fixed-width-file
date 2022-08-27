import { Field } from "@evologi/fixed-width";
import { IDataObject } from "n8n-workflow";

export function getFields(operation: string, fieldConfig: IDataObject): Field[] {
	const rawFields = ((fieldConfig as IDataObject) || {}).field as IDataObject[]|| [];
	const fields: Field[] = rawFields.map(({ property, width, align: alignRaw, dataType }: IDataObject) => {
		let cast;
		let align;

		if (operation === 'fromFile') {
			switch (dataType) {
				case 'number':
					cast = (v: string) => Number(v);
					break;
				case 'integer':
					cast = (v: string) => parseInt(v, 10);
					break;
				case 'float':
					cast = (v: string) => parseFloat(v);
					break;
				case 'boolean':
					cast = (v: string) => Boolean(v);
					break;
				default:
					cast = undefined;
			}
		} else if (operation === 'toFile') {
			align = (alignRaw as string) as "right" | "left" | undefined;
		}

		const field: Field = {
			property: property as string,
			width: width as number,
			cast,
			align,
		};
		return field;
	});

	return fields;
}
