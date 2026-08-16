// ============================================================
// modules/webapp.bicep
//
// Provisions an Azure App Service Plan and Web App to run
// the Node.js application from src/node-app.
// ============================================================

@description('Base name used to derive resource names.')
param appName string

@description('Azure region for the resources.')
param location string

@description('Deployment environment tag.')
param environment string

@description('App Service Plan SKU.')
@allowed(['F1', 'B1', 'B2', 'S1'])
param appServicePlanSku string = 'B1'

@description('.NET runtime version for the web app.')
param dotnetVersion string = 'DOTNETCORE|9.0' // self-contained .NET 10 binary; host stack version does not affect runtime

// ── App Service Plan ─────────────────────────────────────────

resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: '${appName}-plan-${environment}'
  location: location
  tags: {
    app: appName
    component: 'dotnet-api'
    environment: environment
    managedBy: 'bicep'
  }
  sku: {
    name: appServicePlanSku
  }
  kind: 'linux'
  properties: {
    reserved: true // required for Linux plans
  }
}

// ── Web App ───────────────────────────────────────────────────

resource webApp 'Microsoft.Web/sites@2023-01-01' = {
  name: '${appName}-api-${environment}'
  location: location
  tags: {
    app: appName
    component: 'dotnet-api'
    environment: environment
    managedBy: 'bicep'
  }
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      appCommandLine: './ai-genius-api'
      linuxFxVersion: dotnetVersion
      minTlsVersion: '1.2'
      cors: {
        allowedOrigins: ['*']
      }
      appSettings: [
        {
          name: 'ASPNETCORE_ENVIRONMENT'
          value: environment
        }
      ]
    }
  }
}

// ── Outputs ──────────────────────────────────────────────────

@description('Default hostname of the web app.')
output hostname string = webApp.properties.defaultHostName

@description('Resource ID of the web app.')
output resourceId string = webApp.id

@description('Resource ID of the App Service Plan.')
output planResourceId string = appServicePlan.id
