#ifndef EVENT_DRIVEN_H_
#define EVENT_DRIVEN_H_

#include "user_util.h"

/* Exported types ------------------------------------------------------------*/
typedef uint8_t (*fEventHandler) (uint8_t);

typedef struct
{
	uint8_t 		e_name;
	uint8_t			e_status;
	uint32_t 		e_systick;
	uint32_t 		e_period;
	fEventHandler 	e_function_handler;
}sEvent_struct;

/* Exported functions prototypes ---------------------------------------------*/
uint8_t fevent_active(sEvent_struct *event_struct, uint8_t event_name);
uint8_t fevent_enable(sEvent_struct *event_struct, uint8_t event_name);
uint8_t fevent_disable(sEvent_struct *event_struct, uint8_t event_name);

#endif /* EVENT_DRIVEN_H_ */
