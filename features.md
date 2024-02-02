TODO

Finish Store Context and DbSet
Finish Documentation
Make Tests project

can we timestamp all property changes for entity change tracking?  
    Then we can make a determination on conflicts to see what is the latest change
    example:  
        __changes__: { 
            propertyOne: {
                timestamp: 902834902,
                value: "SomeValue"
            }
         }

         __original__: { 
            propertyOne: "OtherValue"
         }
        
        only the changes object would need to be altered.  When we save, those changes need to be passed to the payload for bulk operations
        