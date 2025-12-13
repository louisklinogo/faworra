
paco@paco MINGW64 /d/louis/Developer/new/faworra (master)
$ bun dev
$ turbo run dev
turbo 2.6.1

• Packages in scope: @Faworra/analytics, @Faworra/api, @Faworra/auth, @Faworra/cache, @Faworra/categories, @Faworra/config, @Faworra/database, @Faworra/domain, @Faworra/jobs, @Faworra/location, @Faworra/logging, @Faworra/middleware, @Faworra/realtime, @Faworra/realtime-server, @Faworra/schemas, @Faworra/services, @Faworra/supabase, @Faworra/ui, @Faworra/utils, @Faworra/website, @Faworra/worker, dashboard
• Running dev in 22 packages
• Remote caching disabled
┌─ dashboard#dev > cache bypass, force executing 4e1775f70da693fd
$ next dev --turbo
└─ dashboard#dev ──
┌─ @Faworra/realtime-server#dev > cache bypass, force executing 8af8a13e4f061a0e
$ bun --hot src/index.ts
└─ @Faworra/realtime-server#dev ──
┌─ @Faworra/website#dev > cache bypass, force executing 5b32690d05684256
$ next dev
└─ @Faworra/website#dev ──
┌─ @Faworra/api#dev > cache bypass, force executing 33551181268a8e4b
$ bun --hot src/index.ts
└─ @Faworra/api#dev ──
┌─ @Faworra/worker#dev > cache bypass, force executing 61e390934832d50b
$ bun --hot src/index.ts
warn: File D:\louis\Developer\new\faworra\packages\config\src\index.ts is not in the project directory and will not be watched
└─ @Faworra/worker#dev ──
┌─ @Faworra/jobs#dev > cache bypass, force executing 9da7327db04353d8
$ trigger dev
node:internal/modules/package_json_reader:268
  throw new ERR_MODULE_NOT_FOUND(packageName, fileURLToPath(base), null);
        ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'commander' imported from D:\louis\Developer\new\faworra\node_modules\.bun\trigger.dev@4.1.2+1fb4c
65d43e298b9\node_modules\trigger.dev\dist\esm\cli\index.js
    at Object.getPackageJSONURL (node:internal/modules/package_json_reader:268:9)
    at packageResolve (node:internal/modules/esm/resolve:768:81)
    at moduleResolve (node:internal/modules/esm/resolve:854:18)
    at defaultResolve (node:internal/modules/esm/resolve:984:11)
    at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:685:12)
    at #cachedDefaultResolve (node:internal/modules/esm/loader:634:25)
    at ModuleLoader.resolve (node:internal/modules/esm/loader:617:38)
    at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:273:38)
    at ModuleJob._link (node:internal/modules/esm/module_job:135:49) {
  code: 'ERR_MODULE_NOT_FOUND'
}

Node.js v22.14.0
error: script "dev" exited with code 1

command finished with error: command (D:\louis\Developer\new\faworra\packages\jobs) C:\Users\louis\.bun\bin\bun.exe run dev exited (1)
└─ @Faworra/jobs#dev ──
  × Internal errors encountered: unable to determine why task exited,unable to determine why task exited,unable to determine why task exited,unable to determine why task          
  │ exited,unable to determine why task exited

error: script "dev" exited with code 1

paco@paco MINGW64 /d/louis/Developer/new/faworra (master)
$ 