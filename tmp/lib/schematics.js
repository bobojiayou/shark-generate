"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:no-global-tslint-disable no-any file-header
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const tools_1 = require("@angular-devkit/schematics/tools");
class UnknownCollectionError extends Error {
    constructor(collectionName) {
        super(`Invalid collection (${collectionName}).`);
    }
}
exports.UnknownCollectionError = UnknownCollectionError;
const engineHost = new tools_1.NodeModulesEngineHost();
const engine = new schematics_1.SchematicEngine(engineHost);
// Add support for schemaJson.
const registry = new core_1.schema.CoreSchemaRegistry(schematics_1.formats.standardFormats);
engineHost.registerOptionsTransform(tools_1.validateOptionsWithSchema(registry));
function getEngineHost() {
    return engineHost;
}
exports.getEngineHost = getEngineHost;
function getEngine() {
    return engine;
}
exports.getEngine = getEngine;
function getCollection(collectionName) {
    const engine = getEngine();
    const collection = engine.createCollection(collectionName);
    if (collection === null) {
        throw new UnknownCollectionError(collectionName);
    }
    return collection;
}
exports.getCollection = getCollection;
function getSchematic(collection, schematicName, allowPrivate) {
    return collection.createSchematic(schematicName, allowPrivate);
}
exports.getSchematic = getSchematic;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hdGljcy5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsibGliL3NjaGVtYXRpY3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw2REFBNkQ7QUFDN0QsK0NBQThDO0FBQzlDLDJEQU1vQztBQUNwQyw0REFLMEM7QUFFMUMsNEJBQW9DLFNBQVEsS0FBSztJQUM3QyxZQUFZLGNBQXNCO1FBQzlCLEtBQUssQ0FBQyx1QkFBdUIsY0FBYyxJQUFJLENBQUMsQ0FBQztJQUNyRCxDQUFDO0NBQ0o7QUFKRCx3REFJQztBQUVELE1BQU0sVUFBVSxHQUFHLElBQUksNkJBQXFCLEVBQUUsQ0FBQztBQUMvQyxNQUFNLE1BQU0sR0FDTixJQUFJLDRCQUFlLENBQUMsVUFBVSxDQUFDLENBQUM7QUFFdEMsOEJBQThCO0FBQzlCLE1BQU0sUUFBUSxHQUFHLElBQUksYUFBTSxDQUFDLGtCQUFrQixDQUFDLG9CQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDeEUsVUFBVSxDQUFDLHdCQUF3QixDQUFDLGlDQUF5QixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFHekU7SUFDSSxPQUFPLFVBQVUsQ0FBQztBQUN0QixDQUFDO0FBRkQsc0NBRUM7QUFDRDtJQUNJLE9BQU8sTUFBTSxDQUFDO0FBQ2xCLENBQUM7QUFGRCw4QkFFQztBQUVELHVCQUE4QixjQUFzQjtJQUNoRCxNQUFNLE1BQU0sR0FBRyxTQUFTLEVBQUUsQ0FBQztJQUMzQixNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLENBQUM7SUFFM0QsSUFBSSxVQUFVLEtBQUssSUFBSSxFQUFFO1FBQ3JCLE1BQU0sSUFBSSxzQkFBc0IsQ0FBQyxjQUFjLENBQUMsQ0FBQztLQUNwRDtJQUVELE9BQU8sVUFBVSxDQUFDO0FBQ3RCLENBQUM7QUFURCxzQ0FTQztBQUVELHNCQUE2QixVQUFnQyxFQUN6RCxhQUFxQixFQUNyQixZQUFzQjtJQUN0QixPQUFPLFVBQVUsQ0FBQyxlQUFlLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQ25FLENBQUM7QUFKRCxvQ0FJQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIHRzbGludDpkaXNhYmxlOm5vLWdsb2JhbC10c2xpbnQtZGlzYWJsZSBuby1hbnkgZmlsZS1oZWFkZXJcbmltcG9ydCB7IHNjaGVtYSB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7XG4gICAgQ29sbGVjdGlvbixcbiAgICBFbmdpbmUsXG4gICAgU2NoZW1hdGljLFxuICAgIFNjaGVtYXRpY0VuZ2luZSxcbiAgICBmb3JtYXRzLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge1xuICAgIEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyxcbiAgICBGaWxlU3lzdGVtU2NoZW1hdGljRGVzYyxcbiAgICBOb2RlTW9kdWxlc0VuZ2luZUhvc3QsXG4gICAgdmFsaWRhdGVPcHRpb25zV2l0aFNjaGVtYSxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMnO1xuXG5leHBvcnQgY2xhc3MgVW5rbm93bkNvbGxlY3Rpb25FcnJvciBleHRlbmRzIEVycm9yIHtcbiAgICBjb25zdHJ1Y3Rvcihjb2xsZWN0aW9uTmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHN1cGVyKGBJbnZhbGlkIGNvbGxlY3Rpb24gKCR7Y29sbGVjdGlvbk5hbWV9KS5gKTtcbiAgICB9XG59XG5cbmNvbnN0IGVuZ2luZUhvc3QgPSBuZXcgTm9kZU1vZHVsZXNFbmdpbmVIb3N0KCk7XG5jb25zdCBlbmdpbmU6IEVuZ2luZTxGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjPlxuICAgID0gbmV3IFNjaGVtYXRpY0VuZ2luZShlbmdpbmVIb3N0KTtcblxuLy8gQWRkIHN1cHBvcnQgZm9yIHNjaGVtYUpzb24uXG5jb25zdCByZWdpc3RyeSA9IG5ldyBzY2hlbWEuQ29yZVNjaGVtYVJlZ2lzdHJ5KGZvcm1hdHMuc3RhbmRhcmRGb3JtYXRzKTtcbmVuZ2luZUhvc3QucmVnaXN0ZXJPcHRpb25zVHJhbnNmb3JtKHZhbGlkYXRlT3B0aW9uc1dpdGhTY2hlbWEocmVnaXN0cnkpKTtcblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RW5naW5lSG9zdCgpIHtcbiAgICByZXR1cm4gZW5naW5lSG9zdDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRFbmdpbmUoKTogRW5naW5lPEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYywgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2M+IHtcbiAgICByZXR1cm4gZW5naW5lO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29sbGVjdGlvbihjb2xsZWN0aW9uTmFtZTogc3RyaW5nKTogQ29sbGVjdGlvbjxhbnksIGFueT4ge1xuICAgIGNvbnN0IGVuZ2luZSA9IGdldEVuZ2luZSgpO1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBlbmdpbmUuY3JlYXRlQ29sbGVjdGlvbihjb2xsZWN0aW9uTmFtZSk7XG5cbiAgICBpZiAoY29sbGVjdGlvbiA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgVW5rbm93bkNvbGxlY3Rpb25FcnJvcihjb2xsZWN0aW9uTmFtZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbGxlY3Rpb247XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTY2hlbWF0aWMoY29sbGVjdGlvbjogQ29sbGVjdGlvbjxhbnksIGFueT4sXG4gICAgc2NoZW1hdGljTmFtZTogc3RyaW5nLFxuICAgIGFsbG93UHJpdmF0ZT86IGJvb2xlYW4pOiBTY2hlbWF0aWM8YW55LCBhbnk+IHtcbiAgICByZXR1cm4gY29sbGVjdGlvbi5jcmVhdGVTY2hlbWF0aWMoc2NoZW1hdGljTmFtZSwgYWxsb3dQcml2YXRlKTtcbn1cbiJdfQ==