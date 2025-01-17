import registerComponent from '@/utils/register-component/';
import { getLayouts } from './index';
import api from '@/api';
import { getRootPath } from '@/utils/get-root-path';
import asyncPool from 'tiny-async-pool';

const layouts = getLayouts();

export async function registerLayouts() {
	const context = require.context('.', true, /^.*index\.ts$/);

	const modules = context
		.keys()
		.map((key) => context(key))
		.map((mod) => mod.default)
		.filter((m) => m);

	try {
		const customResponse = await api.get('/extensions/layouts');
		const layouts: string[] = customResponse.data.data || [];

		await asyncPool(5, layouts, async (layoutName) => {
			try {
				const result = await import(
					/* webpackIgnore: true */ getRootPath() + `extensions/layouts/${layoutName}/index.js`
				);
				modules.push(result.value.default);
			} catch (err) {
				console.warn(`Couldn't load custom layout "${layoutName}"`);
			}
		});
	} catch {
		console.warn(`Couldn't load custom layouts`);
	}

	layouts.value = modules;

	layouts.value.forEach((layout) => {
		registerComponent('layout-' + layout.id, layout.component);
	});
}
