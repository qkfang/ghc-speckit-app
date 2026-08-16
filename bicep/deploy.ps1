
az group create --name "rg-aigenius4-dev" --location "eastus2" 

az deployment group create --resource-group "rg-aigenius4-dev" --template-file bicep/main.bicep --parameters "bicep/parameters.dev.json"
