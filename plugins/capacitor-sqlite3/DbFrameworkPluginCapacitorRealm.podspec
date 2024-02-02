
  Pod::Spec.new do |s|
    s.name = 'DbFrameworkPluginCapacitorRealm'
    s.version = '1.0.0'
    s.summary = 'Db Framework Plugin Capacitor Realm'
    s.license = 'MIT'
    s.homepage = 'https://github.com/agrejus/db-framework-plugin-capacitor-realm.git'
    s.author = 'James DeMeuse'
    s.source = { :git => 'https://github.com/agrejus/db-framework-plugin-capacitor-realm.git', :tag => s.version.to_s }
    s.source_files = 'ios/Plugin/**/*.{swift,h,m,c,cc,mm,cpp}'
    s.ios.deployment_target  = '12.0'
    s.dependency 'Capacitor'
    s.swift_version = '5.1'
  end
