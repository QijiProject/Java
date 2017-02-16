/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.bae.dao;

import org.hibernate.Transaction;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Autowired;

/**
 *
 * @author Heng Wai
 */
public abstract class GenericDaoImpl<T> implements GenericDao<T> {
    @Autowired
    SessionFactory sessionFactory;
    
    @Override
    public T saveOrUpdate(final T t) {
        Session session  = this.getCurrentSession();
        Transaction transaction = session.beginTransaction();
        session.saveOrUpdate(t);
        transaction.commit();
        return t;
    }
    
    protected final Session getCurrentSession(){
      return this.sessionFactory.getCurrentSession();
   }
    
}
