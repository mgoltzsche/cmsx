cmsx because ...
  ... it is the Xth CMS I am writing and there are so many others already
  ... it runs on the BaseX XML database

Requirements:
  - Java 7 (sadly since BaseX does not yet support Java 8)
  - Maven 3

Build XAR artifact with maven:
  mvn clean install

Build and deploy on local BaseX server's repository using the XAR plugin
  mvn xar:deploy-basex
